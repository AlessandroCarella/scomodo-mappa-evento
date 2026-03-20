# # Clustering Pipeline — `analisi_storie.json` updater
# Set `INPUT_FILE` to the name of your `.txt` file (one sentence per line), then **Run All**.

# ── PARAMETERS ────────────────────────────────────────────────
INPUT_FILE   = "public/data/storie.json"          
INPUT_BACKUP_FILE   = "public/data/storie_backup.json"          
OUTPUT_FILE  =  "public/data/analisi_storie.json"
MIN_TOPIC_SIZE = 5  
TIMEOUT_TIME = 60 # seconds to wait if no changes in file
# ──────────────────────────────────────────────────────────────

import json, re, warnings
warnings.filterwarnings('ignore')

import pandas as pd
import spacy
import nltk
from nltk.corpus import stopwords
from nltk.stem import SnowballStemmer
from nltk.tokenize import word_tokenize, sent_tokenize
from bertopic import BERTopic
from sentence_transformers import SentenceTransformer
import time
import json

nltk.download('stopwords', quiet=True)
nltk.download('punkt',     quiet=True)
nltk.download('punkt_tab', quiet=True)

nlp = spacy.load("it_core_news_sm")
italian_stopwords = set(stopwords.words('italian'))
stemmer = SnowballStemmer('italian')

class ItalianTextPreprocessor:
    def __init__(self, nlp_model):
        self.nlp       = nlp_model
        self.stopwords = italian_stopwords
        self.stemmer   = stemmer

    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\S*@\S*\s?', '', text)
        text = re.sub(r'@\w+', '', text)
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', '', text)
        return re.sub(r'\s+', ' ', text).strip()

    def tokenize_and_filter(self, text):
        tokens = word_tokenize(text, language='italian')
        return [
            t for t in tokens
            if len(t) > 2 and t not in self.stopwords and t.isalpha()
        ]

    def extract_entities(self, text):
        return [(ent.text, ent.label_) for ent in self.nlp(text).ents]

    def extract_pos_tags(self, text):
        return [
            (tok.text, tok.pos_) for tok in self.nlp(text)
            if tok.pos_ in ('NOUN', 'ADJ', 'VERB')
        ]

    def preprocess_full(self, text):
        cleaned = self.clean_text(text)
        tokens  = self.tokenize_and_filter(cleaned)
        return {
            'cleaned_text':   cleaned,
            'tokens':         tokens,
            'stemmed_tokens': [self.stemmer.stem(t) for t in tokens],
            'entities':       self.extract_entities(text),
            'pos_tags':       self.extract_pos_tags(text),
        }

def readStories ():
    with open (INPUT_FILE, encoding="utf-8") as f:
        data = json.load(f) 
    stories = []
    for story in data:
        if story["tipo"]:
            stories.append(story["storia"])
    return stories

prev_texts = readStories()
with open (INPUT_BACKUP_FILE, "w", encoding="utf-8") as f:
    json.dump(prev_texts, f, indent=4, ensure_ascii=False)
    
while True:
    texts = readStories()
    
    if texts == prev_texts:
        print("Waiting a minute for file to update...")
        time.sleep (TIMEOUT_TIME)
    else:
        df = pd.DataFrame({'response': texts, 'id': range(len(texts))})
        print(f"Loaded {len(texts)} sentences from '{INPUT_FILE}'")

        preprocessor  = ItalianTextPreprocessor(nlp_model=nlp)
        processed_data = []

        for i, text in enumerate(texts):
            result = preprocessor.preprocess_full(text)
            result['original_text'] = text
            result['id'] = i
            processed_data.append(result)

        df['cleaned_text']   = [d['cleaned_text']   for d in processed_data]
        df['tokens']         = [d['tokens']         for d in processed_data]
        df['stemmed_tokens'] = [d['stemmed_tokens'] for d in processed_data]
        df['entities']       = [d['entities']       for d in processed_data]
        df['pos_tags']       = [d['pos_tags']       for d in processed_data]

        print("Preprocessing done.")

        texts_for_modeling = [' '.join(tokens) for tokens in df['tokens']]

        sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

        topic_model = BERTopic(
            language="italian",
            embedding_model=sentence_model,
            min_topic_size=MIN_TOPIC_SIZE,
            verbose=True,
        )

        topics, probs = topic_model.fit_transform(texts_for_modeling)

        df['bertopic']      = topics
        df['bertopic_prob'] = probs

        topic_info = topic_model.get_topic_info()
        print(f"BERTopic found {len(topic_info)} topics (including outlier -1).")

        def get_streamlined_representative_docs(topic_model, texts_for_modeling, df):
            streamlined_topic_info = []
            topic_info = topic_model.get_topic_info()

            for _, row in topic_info.iterrows():
                topic_id = row['Topic']
                if topic_id == -1:
                    continue

                topic_name         = row['Name']
                topic_count        = row['Count']
                representative_words = row['Representation']

                topic_docs_indices = df[df['bertopic'] == topic_id].index.tolist()
                topic_docs         = [texts_for_modeling[i] for i in topic_docs_indices]
                original_docs      = [df.iloc[i]['response'] for i in topic_docs_indices]
                probabilities      = [df.iloc[i]['bertopic_prob'] for i in topic_docs_indices]

                streamlined_word_analysis = {}

                for word in representative_words[:10]:
                    word_docs        = []
                    word_occurrences = 0

                    for i, (processed_doc, original_doc, prob) in enumerate(
                        zip(topic_docs, original_docs, probabilities)
                    ):
                        word_count = processed_doc.lower().count(word.lower())
                        if word_count > 0:
                            word_occurrences += word_count
                            sentences_with_word = [
                                s.strip()
                                for s in sent_tokenize(original_doc, language='italian')
                                if word.lower() in s.lower()
                            ]
                            word_docs.append({
                                'testo originale':  original_doc,
                                'testo processato': processed_doc,
                                'index':            topic_docs_indices[i],
                                'lunghezza testo':  len(original_doc),
                                'bertopic prob':    float(prob),
                                'risposte con parola': sentences_with_word,
                            })

                    word_docs.sort(
                        key=lambda x: (x['bertopic prob'], processed_doc.lower().count(word.lower())),
                        reverse=True,
                    )

                    streamlined_word_analysis[word] = {
                        'quantità risposte rappresentative': len(word_docs),
                        'risposte rappresentative': [
                            {
                                'testo originale':  d['testo originale'],
                                'testo processato': d['testo processato'],
                                'lunghezza testo':  d['lunghezza testo'],
                                'bertopic prob':    d['bertopic prob'],
                            }
                            for d in word_docs
                        ],
                    }

                clean_name = topic_name.title().replace(f'{topic_id}_', '').replace('_', ' ')
                streamlined_topic_info.append({
                    clean_name: {
                        'quantità risposte': int(topic_count),
                        'parole chiavi':     streamlined_word_analysis,
                    }
                })

            return streamlined_topic_info

        streamlined_analysis = get_streamlined_representative_docs(
            topic_model, texts_for_modeling, df
        )

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as file:
            json.dump(streamlined_analysis, file, ensure_ascii=False, indent=4)

    prev_texts = texts # update previous text
