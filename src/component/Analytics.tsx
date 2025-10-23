import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  IconButton,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faDownload,
  faUsers,
  faTasks,
  faClock,
  faCheckCircle,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";

interface Employee {
  _id: string;
  name: string;
  email: string;
  subRole: string;
}

interface EmployeeStats {
  employeeId: string;
  name: string;
  email: string;
  subRole: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  onHoldTasks: number;
  pendingTasks: number;
  totalHoursWorked: number;
  attendanceDays: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analyticsData, setAnalyticsData] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
    fetchAnalytics();
  }, [navigate, timeRange, selectedDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/analytics/all?timeRange=${timeRange}&date=${selectedDate.toISOString()}`);
      setAnalyticsData(res.data.employeeStats || []);
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await api.get(`/api/analytics/download-pdf?timeRange=${timeRange}&date=${selectedDate.toISOString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF. Please try again.");
    }
  };

  const getTotalStats = () => {
    const total = analyticsData.reduce(
      (acc, emp) => ({
        tasks: acc.tasks + emp.totalTasks,
        completed: acc.completed + emp.completedTasks,
        hours: acc.hours + emp.totalHoursWorked,
        employees: analyticsData.length,
      }),
      { tasks: 0, completed: 0, hours: 0, employees: 0 }
    );
    return total;
  };

  const totalStats = getTotalStats();

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "daily":
        return selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      case "weekly":
        return `Week of ${selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`;
      case "monthly":
        return selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      case "yearly":
        return selectedDate.getFullYear().toString();
      default:
        return "";
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "var(--bg-main)" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          px: { xs: 2, sm: 3, md: 5 },
          py: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(8px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => navigate("/dashboard")}
            sx={{
              color: "var(--text-secondary)",
              "&:hover": {
                bgcolor: "var(--bg-hover)",
                color: "var(--primary)",
              },
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </IconButton>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "var(--text-primary)",
                mb: 0.3,
                letterSpacing: "-0.02em",
              }}
            >
              Analytics Dashboard
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--text-secondary)",
                fontSize: "13px",
              }}
            >
              {getTimeRangeLabel()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: "var(--text-secondary)",
              "&:hover": {
                bgcolor: "var(--bg-hover)",
                color: "var(--primary)",
              },
            }}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </IconButton>

          <Button
            onClick={handleDownloadPDF}
            startIcon={<FontAwesomeIcon icon={faDownload} />}
            sx={{
              borderRadius: "8px",
              px: 2.5,
              py: 1,
              bgcolor: "var(--primary)",
              color: "#000",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "14px",
              "&:hover": {
                bgcolor: "var(--primary-hover)",
              },
            }}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1400, margin: "0 auto" }}>
        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 4,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            sx={{
              minWidth: 150,
              bgcolor: "var(--bg-surface)",
              color: "var(--text-primary)",
              borderRadius: "8px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--border)",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--primary)",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--primary)",
              },
            }}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="yearly">Yearly</MenuItem>
          </Select>

          <input
            type={timeRange === "yearly" ? "number" : timeRange === "monthly" ? "month" : "date"}
            value={
              timeRange === "yearly"
                ? selectedDate.getFullYear()
                : timeRange === "monthly"
                ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`
                : selectedDate.toISOString().split("T")[0]
            }
            onChange={(e) => {
              if (timeRange === "yearly") {
                setSelectedDate(new Date(parseInt(e.target.value), 0, 1));
              } else if (timeRange === "monthly") {
                const [year, month] = e.target.value.split("-");
                setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, 1));
              } else {
                setSelectedDate(new Date(e.target.value));
              }
            }}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
            }}
          />
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--primary)",
                  boxShadow: "0 4px 12px rgba(204, 255, 0, 0.1)",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faUsers} style={{ color: "#10b981", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                      {totalStats.employees}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Total Employees
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--primary)",
                  boxShadow: "0 4px 12px rgba(204, 255, 0, 0.1)",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faTasks} style={{ color: "#2563eb", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                      {totalStats.tasks}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Total Tasks
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--primary)",
                  boxShadow: "0 4px 12px rgba(204, 255, 0, 0.1)",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#f0fdf4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} style={{ color: "#10b981", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                      {totalStats.completed}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Completed Tasks
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                bgcolor: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "var(--primary)",
                  boxShadow: "0 4px 12px rgba(204, 255, 0, 0.1)",
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "10px",
                      bgcolor: "#fef3c7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesomeIcon icon={faClock} style={{ color: "#f59e0b", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--text-primary)", mb: 0.5 }}>
                      {Math.round(totalStats.hours)}h
                    </Typography>
                    <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      Total Hours
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Employee Stats Table */}
        <Box
          sx={{
            bgcolor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 3, borderBottom: "1px solid var(--border)" }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Employee Performance
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography sx={{ color: "var(--text-secondary)" }}>Loading...</Typography>
            </Box>
          ) : analyticsData.length === 0 ? (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography sx={{ color: "var(--text-secondary)" }}>No data available for this period</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Table Header */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
                    gap: 2,
                    p: 2,
                    bgcolor: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)" }}>
                    Employee
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)" }}>
                    Role
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Tasks
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Completed
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                    In Progress
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Hours
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: "13px", color: "var(--text-secondary)", textAlign: "center" }}>
                    Attendance
                  </Typography>
                </Box>

                {/* Table Rows */}
                {analyticsData.map((emp) => (
                  <Box
                    key={emp.employeeId}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr 1fr",
                      gap: 2,
                      p: 2,
                      borderBottom: "1px solid var(--border)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: "var(--bg-hover)",
                      },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", mb: 0.3 }}>
                        {emp.name}
                      </Typography>
                      <Typography sx={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {emp.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: "5px",
                          bgcolor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>
                          {emp.subRole}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: "14px", color: "var(--text-primary)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {emp.totalTasks}
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#10b981", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {emp.completedTasks}
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "#2563eb", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {emp.inProgressTasks}
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "var(--text-primary)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {Math.round(emp.totalHoursWorked)}h
                    </Typography>
                    <Typography sx={{ fontSize: "14px", color: "var(--text-primary)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      {emp.attendanceDays} days
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
