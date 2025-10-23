import { Routes, Route } from "react-router-dom";
import LoginForm from "./component/login";
import Dashboard from "./component/Dashboard";
import EmployeeDashboard from "./component/EmployeeDashboard";
import TrelloBoard from "./component/TrelloBoard";
import TrelloEmployee from "./component/TrelloEmployee";
import Analytics from "./component/Analytics";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginForm />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/trello" element={<TrelloBoard />} />
      <Route path="/trello-employee" element={<TrelloEmployee />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}

export default App;
