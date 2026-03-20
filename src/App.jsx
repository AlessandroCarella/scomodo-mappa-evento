import { BrowserRouter, Routes, Route } from "react-router-dom";
import Map from "./components/Map";
import TopicPage from "./pages/Topic";
import FormPage from "./pages/Form";
import InDevelopmentPage from "./pages/InDevelopment";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Map />} />
                <Route
                    path="/topic"
                    element={<TopicPage onBack={() => window.history.back()} />}
                />
                <Route path="/form" element={<FormPage />} />
                <Route path="/sviluppo" element={<InDevelopmentPage />} />
            </Routes>
        </BrowserRouter>
    );
}
