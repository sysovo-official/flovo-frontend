import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faCircleCheck,
  faCirclePause,
  faCirclePlay,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../context/ThemeContext";
import { IconButton } from "@mui/material";

type Task = {
  _id: string;
  title: string;
  assignedSubRole: string;
  status: string;
  createdAt: string;
};

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Attendance states
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [timeWorked, setTimeWorked] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // 🟢 Fetch Tasks
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await api.get("/api/tasks/my-tasks");
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();

    // ✅ Fetch attendance session
    const fetchSession = async () => {
      try {
        const res = await api.get("/api/attendance/current");

        if (res.data.isActive) {
          setIsPunchedIn(true);
          setPunchInTime(new Date(res.data.punchInTime));
        } else {
          setIsPunchedIn(false);
          setPunchInTime(null);
        }
      } catch (err) {
        console.error("Failed to fetch attendance session", err);
      }
    };

    fetchSession();
  },
   [navigate, token]);

  // 🕒 Live Timer
  useEffect(() => {
    if (isPunchedIn && punchInTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = (now.getTime() - punchInTime.getTime()) / 1000;
        setTimeWorked(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPunchedIn, punchInTime]);

  // ⏱ Format time (hh:mm:ss)
  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds); // ✅ Decimals hata dega

    const hrs = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");

    const mins = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");

    const secs = (totalSeconds % 60).toString().padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };


  // ✅ Punch In
  const handlePunchIn = async () => {
    try {
      await api.post("/api/attendance/punchin", {});
      setIsPunchedIn(true);
      setPunchInTime(new Date());
      setTimeWorked(0);
    } catch (err) {
      console.error("Failed to punch in", err);
    }
  };

  // ✅ Punch Out
  const handlePunchOut = async () => {
    try {
      await api.post("/api/attendance/punchout", {});
      setIsPunchedIn(false);
      setPunchInTime(null);
      setTimeWorked(0);
    } catch (err) {
      console.error("Failed to punch out", err);
    }
  };

  // ✅ Task Status Update
  const handleMarkAsDone = async (taskId: string) => {
    try {
      await api.put(
        `/api/tasks/${taskId}/status`,
        { status: "Completed" }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "Completed" } : t))
      );
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };


  // ⏸️ Mark as OnHold
  const handleMarkAsOnHold = async (taskId: string) => {
    try {
      await api.put(
        `/api/tasks/${taskId}/status`,
        { status: "OnHold" }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "OnHold" } : t))
      );
    } catch (err) {
      console.error("Failed to mark task as OnHold", err);
    }
  };


  const handleResumeTask = async (taskId: string) => {
    try {
      await api.put(
        `/api/tasks/${taskId}/status`,
        { status: "Pending" }
      );

      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: "Pending" } : t))
      );
    } catch (err) {
      console.error("Failed to resume task", err);
    }
  };

  // ✅ Navigate to Trello Employee Board
  const handleGoToTrello = () => {
    navigate("/trello-employee");
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
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
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "var(--text-primary)",
              mb: 0.3,
              letterSpacing: "-0.02em"
            }}
          >
            {user.name || user.email || "User"}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--text-secondary)",
              fontSize: "13px"
            }}
          >
            {user.subRole}
          </Typography>
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
            onClick={handleLogout}
            startIcon={<FontAwesomeIcon icon={faRightFromBracket} />}
            sx={{
              borderRadius: "8px",
              px: 2.5,
              py: 1,
              color: "var(--text-secondary)",
              textTransform: "none",
              fontWeight: 500,
              fontSize: "14px",
              "&:hover": {
                bgcolor: "var(--bg-hover)",
                color: "var(--text-primary)",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1200, margin: "0 auto" }}>
        {/* Attendance Card */}
        <Box
          sx={{
            bgcolor: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            p: 3.5,
            mb: 5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--text-primary)",
              mb: 2.5,
              letterSpacing: "-0.01em"
            }}
          >
            Attendance
          </Typography>

          {!isPunchedIn ? (
            <Box>
              <Typography
                sx={{
                  color: "var(--text-secondary)",
                  mb: 2,
                  fontSize: "14px"
                }}
              >
                Not clocked in
              </Typography>
              <Button
                variant="contained"
                onClick={handlePunchIn}
                sx={{
                  borderRadius: "8px",
                  px: 3,
                  py: 1.2,
                  bgcolor: "var(--primary)",
                  color: "#000",
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "14px",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "var(--primary-hover)",
                    boxShadow: "0 4px 16px rgba(204, 255, 0, 0.3)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                Clock In
              </Button>
            </Box>
          ) : (
            <Box>
              <Box
                sx={{
                  display: "inline-block",
                  bgcolor: "var(--bg-main)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  px: 3.5,
                  py: 2,
                  mb: 2.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    fontWeight: 600,
                  }}
                >
                  Time Worked
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "var(--primary)",
                    fontFamily: "monospace",
                    mt: 0.5,
                  }}
                >
                  {formatTime(timeWorked)}
                </Typography>
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={handlePunchOut}
                  sx={{
                    borderRadius: "8px",
                    px: 3,
                    py: 1.2,
                    bgcolor: "var(--error)",
                    color: "white",
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "14px",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "var(--error-hover)",
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Clock Out
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Trello Board Button */}
        <Box sx={{ mb: 5 }}>
          <Button
            onClick={handleGoToTrello}
            sx={{
              borderRadius: "8px",
              px: 3,
              py: 1.5,
              bgcolor: "#6366f1",
              color: "white",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "14px",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                bgcolor: "#8b5cf6",
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Go to My Trello Boards
          </Button>
        </Box>

        {/* Tasks Section */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "var(--text-primary)",
            mb: 2.5,
            letterSpacing: "-0.01em"
          }}
        >
          Tasks
        </Typography>

        {loading ? (
          <Typography
            sx={{
              color: "var(--text-secondary)",
              fontSize: "14px"
            }}
          >
            Loading...
          </Typography>
        ) : tasks.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: "var(--bg-surface)",
              borderRadius: "10px",
              border: "1px solid var(--border)",
            }}
          >
            <Typography
              sx={{
                color: "var(--text-secondary)",
                fontSize: "14px"
              }}
            >
              No tasks assigned yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {tasks.map((t) => (
              <Box
                key={t._id}
                sx={{
                  bgcolor: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  p: 2.5,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "var(--primary-light)",
                    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    mb: 0.8,
                    fontSize: "15px",
                  }}
                >
                  {t.title}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    display: "block",
                    mb: 1.5
                  }}
                >
                  {new Date(t.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </Typography>

                {/* Status Badge */}
                <Box
                  sx={{
                    display: "inline-block",
                    px: 1.5,
                    py: 0.3,
                    borderRadius: "5px",
                    bgcolor:
                      t.status === "Completed"
                        ? "#f0fdf4"
                        : t.status === "OnHold"
                        ? "#fef2f2"
                        : t.status === "In Progress"
                        ? "#eff6ff"
                        : "#fef3c7",
                    border: `1px solid ${
                      t.status === "Completed"
                        ? "#bbf7d0"
                        : t.status === "OnHold"
                        ? "#fecaca"
                        : t.status === "In Progress"
                        ? "#bfdbfe"
                        : "#fde68a"
                    }`,
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: "11px",
                      color:
                        t.status === "Completed"
                          ? "var(--success)"
                          : t.status === "OnHold"
                          ? "var(--error)"
                          : t.status === "In Progress"
                          ? "#2563eb"
                          : "var(--warning)",
                    }}
                  >
                    {t.status}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {t.status !== "Completed" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleMarkAsDone(t._id)}
                      startIcon={<FontAwesomeIcon icon={faCircleCheck} />}
                      sx={{
                        borderRadius: "6px",
                        px: 2,
                        py: 0.7,
                        bgcolor: "var(--success)",
                        color: "white",
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "12px",
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: "var(--success-hover)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    >
                      Complete
                    </Button>
                  )}

                  {t.status === "Pending" && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleMarkAsOnHold(t._id)}
                      startIcon={<FontAwesomeIcon icon={faCirclePause} />}
                      sx={{
                        borderRadius: "6px",
                        px: 2,
                        py: 0.7,
                        borderColor: "var(--border)",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "12px",
                        "&:hover": {
                          borderColor: "var(--warning)",
                          bgcolor: "transparent",
                          color: "var(--warning)",
                        },
                      }}
                    >
                      Hold
                    </Button>
                  )}

                  {t.status === "OnHold" && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleResumeTask(t._id)}
                      startIcon={<FontAwesomeIcon icon={faCirclePlay} />}
                      sx={{
                        borderRadius: "6px",
                        px: 2,
                        py: 0.7,
                        bgcolor: "var(--primary)",
                        color: "white",
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "12px",
                        boxShadow: "none",
                        "&:hover": {
                          bgcolor: "var(--primary-hover)",
                          transform: "translateY(-1px)",
                        },
                        transition: "all 0.15s ease",
                      }}
                    >
                      Resume
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
