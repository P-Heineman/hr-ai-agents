import CandidatePage from "./pages/CandidatePage";
import HRDashboard from "./pages/HRDashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CandidateDetails from "./components/CandidateDetails";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CandidatePage />} />
        <Route path="/dashboard" element={<HRDashboard />} />
        <Route path="/candidate/:email" element={<CandidateDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
