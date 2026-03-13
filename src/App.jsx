import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./components/styles/global.css";
import Map from "./components/Map";
import TopicPage from "./pages/Topic";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Map />} />
                <Route
                    path="/topic"
                    element={<TopicPage onBack={() => window.history.back()} />}
                />
            </Routes>
        </BrowserRouter>
    );
}
