import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./components/styles/global.css";
import Map from "./components/Map";
import ViaggioMap from "./components/Viaggi/ViaggioMap";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Map />} />
                <Route path="/viaggi" element={<ViaggioMap />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
