import { Link } from "react-router-dom";
import "./ViaggioNavButton.css";

export default function ViaggioNavButton() {
    return (
        <Link to="/viaggi" className="vg-nav-btn" title="Viaggi d'Italia">
            <span className="vg-nav-btn__dot" />
            <span className="vg-nav-btn__label">Viaggi d'Italia</span>
        </Link>
    );
}
