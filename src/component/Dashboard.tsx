// Dashboard.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  Alert,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../config/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrashCan,
  faPlus,
  faRightFromBracket,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const navigate = useNavigate();


  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // ---------------------- SHOW ASSIGNED TASKS ----------------------
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get("/api/tasks/all");
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      }
    };

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/api/auth/employees");
        setEmployees(res.data.employees || []);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };

    fetchTasks();
    fetchEmployees();
  }, []);

  // ---------------------- EMPLOYEE MODAL STATE ----------------------
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subRole, setSubRole] = useState("Developer"); // default Developer
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setSubRole("Developer");
    setSuccess("");
    setError("");
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/api/auth/add", {
        name,
        email,
        password,
        subRole,
      });

      setSuccess(res.data.message);
      setName("");
      setEmail("");
      setPassword("");
      setSubRole("Developer");

      // Refresh employees list
      const empRes = await api.get("/api/auth/employees");
      setEmployees(empRes.data.employees || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add employee");
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;

    try {
      await api.delete(`/api/auth/employee/${employeeId}`);
      setEmployees((prev) => prev.filter((e) => e._id !== employeeId));
    } catch (err: any) {
      alert("Failed to delete employee");
    }
  };

  // ---------------------- TASK MODAL STATE ----------------------
  const [openTask, setOpenTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskRole, setTaskRole] = useState("");
  const [taskSuccess, setTaskSuccess] = useState("");
  const [taskError, setTaskError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [specificUser, setSpecificUser] = useState("");

  const handleRoleChange = async (e: { target: { value: any } }) => {
    const role = e.target.value;
    setTaskRole(role);
    setSpecificUser("");

    try {
      const res = await api.get("/api/auth/employees");

      // Filter users jinka subRole match kare
      const filtered = res.data.employees.filter(
        (emp: { subRole: any }) => emp.subRole === role
      );
      setDevelopers(filtered);
    } catch (error) {
      console.error("Error fetching developers:", error);
    }
  };

  const handleTaskOpen = () => setOpenTask(true);
  const handleTaskClose = () => {
    setOpenTask(false);
    setTaskTitle("");
    setTaskRole("Developer");
    setTaskSuccess("");
    setTaskError("");
    setEditingTaskId(null);
  };

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTaskError("");
    setTaskSuccess("");

    try {
      const body = {
        title: taskTitle,
        assignedTo: taskRole, // ✅ send role string
        specificUser: specificUser || null, // ✅ send user ID if selected
      };

      if (editingTaskId) {
        await api.put(
          `/api/tasks/${editingTaskId}`,
          body
        );
        setTaskSuccess("Task updated successfully!");
      } else {
        const res = await api.post(
          "/api/tasks/add",
          body
        );
        setTaskSuccess(res.data.message);
      }

      const tasksRes = await api.get("/api/tasks/all");
      setTasks(tasksRes.data.tasks || []);

      setTaskTitle("");
      setTaskRole("Developer");
      setSpecificUser("");
      setEditingTaskId(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setTaskError(err.response?.data?.message || "Failed to save task");
      } else {
        setTaskError("Something went wrong");
      }
    }
  };

  const handleEditTask = (task: any) => {
    setTaskTitle(task.title);
    setTaskRole(task.assignedSubRole);
    setEditingTaskId(task._id);
    setOpenTask(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err: any) {
      alert("Failed to delete task");
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (
      !window.confirm("Are you sure you want to delete this attendance record?")
    )
      return;

    try {
      await api.delete(`/api/attendance/${attendanceId}`);
      // Refresh attendance records
      window.location.reload();
    } catch (err: any) {
      alert("Failed to delete attendance record");
    }
  };

  //--------------------------------------------------------------


const handleGoToTrello = () => {
  navigate("/trello");
};


  // -----------------------------------------------------------------
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
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "var(--text-secondary)",
              fontSize: "13px",
            }}
          >
            {user.email || "User"}
          </Typography>
        </Box>

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

      {/* Main Content */}
      <Box
        sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1200, margin: "0 auto" }}
      >
        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 5 }}>
          <Button
            variant="contained"
            onClick={handleOpen}
            startIcon={<FontAwesomeIcon icon={faPlus} />}
            sx={{
              borderRadius: "8px",
              px: 2.5,
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
            Employee
          </Button>

          <Button
            variant="contained"
            onClick={handleTaskOpen}
            startIcon={<FontAwesomeIcon icon={faPlus} />}
            sx={{
              borderRadius: "8px",
              px: 2.5,
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
            Task
          </Button>

          <Button
            onClick={handleGoToTrello}
            style={{
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Go to Trello Board
          </Button>

        </Box>

        {/* ---------------------- ADD EMPLOYEE MODAL ---------------------- */}
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 450,
              bgcolor: "var(--bg-surface)",
              p: 4,
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "var(--text-primary)",
                mb: 3,
                letterSpacing: "-0.01em",
              }}
            >
              Add Employee
            </Typography>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2.5,
                  borderRadius: "8px",
                  bgcolor: "#fef2f2",
                  color: "var(--error)",
                  border: "1px solid #fecaca",
                  fontSize: "13px",
                }}
              >
                {error}
              </Alert>
            )}
            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 2.5,
                  borderRadius: "8px",
                  bgcolor: "#f0fdf4",
                  color: "var(--success)",
                  border: "1px solid #bbf7d0",
                  fontSize: "13px",
                }}
              >
                {success}
              </Alert>
            )}

            <form onSubmit={handleAddEmployee}>
              <TextField
                label="Name"
                type="text"
                fullWidth
                margin="dense"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                }}
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="dense"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                }}
              />

              <TextField
                select
                label="Sub Role"
                fullWidth
                margin="dense"
                value={subRole}
                onChange={(e) => setSubRole(e.target.value)}
                required
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                  "& .MuiSelect-icon": {
                    color: "var(--text-secondary)",
                  },
                }}
              >
                <MenuItem value="Developer">Developer</MenuItem>
                <MenuItem value="Designer">Designer</MenuItem>
                <MenuItem value="Content Writer">Content Writer</MenuItem>
                <MenuItem value="SEO">SEO</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </TextField>

              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="dense"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mb: 2.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.3,
                  borderRadius: "8px",
                  bgcolor: "var(--primary)",
                  color: "#000",
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "14px",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: "var(--primary-hover)",
                    boxShadow: "0 4px 16px rgba(204, 255, 0, 0.3)",
                  },
                }}
              >
                Add Employee
              </Button>
            </form>
          </Box>
        </Modal>

        {/* ---------------------- ADD TASK MODAL ---------------------- */}

        <Modal open={openTask} onClose={handleTaskClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 450,
              bgcolor: "var(--bg-surface)",
              p: 4,
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "var(--text-primary)",
                mb: 3,
                letterSpacing: "-0.01em",
              }}
            >
              {editingTaskId ? "Edit Task" : "Add Task"}
            </Typography>

            {taskError && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {taskError}
              </Alert>
            )}
            {taskSuccess && (
              <Alert severity="success" sx={{ mb: 2.5 }}>
                {taskSuccess}
              </Alert>
            )}

            <form onSubmit={handleAddTask}>
              {/* ✅ Task Title */}
              <TextField
                label="Task Title"
                fullWidth
                margin="dense"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                }}
              />

              {/* ✅ Select Role */}
              <TextField
                select
                label="Select Role"
                fullWidth
                margin="dense"
                value={taskRole}
                onChange={handleRoleChange}
                required
                sx={{
                  mb: 1.5,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "var(--text-primary)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--primary-light)" },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--primary)",
                      borderWidth: "1.5px",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    "&.Mui-focused": { color: "var(--primary)" },
                  },
                  "& .MuiOutlinedInput-input": {
                    color: "var(--text-primary)",
                  },
                }}
              >
                <MenuItem value="Developer">Developer</MenuItem>
                <MenuItem value="Designer">Designer</MenuItem>
                <MenuItem value="Content Writer">Content Writer</MenuItem>
                <MenuItem value="SEO">SEO</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </TextField>

              {/* ✅ Show all users of that role */}
              {developers.length > 0 && (
                <TextField
                  select
                  label="Select Employee"
                  fullWidth
                  margin="dense"
                  value={specificUser}
                  onChange={(e) => setSpecificUser(e.target.value)}
                  sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      "& fieldset": { borderColor: "var(--border)" },
                      "&:hover fieldset": { borderColor: "var(--primary-light)" },
                      "&.Mui-focused fieldset": {
                        borderColor: "var(--primary)",
                        borderWidth: "1.5px",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      "&.Mui-focused": { color: "var(--primary)" },
                    },
                    "& .MuiOutlinedInput-input": {
                      color: "var(--text-primary)",
                    },
                  }}
                >
                  {/* 👇 Add this option */}
                  <MenuItem value="">Assign to all {taskRole}s</MenuItem>

                  {developers.map((dev) => (
                    <MenuItem key={dev._id} value={dev._id}>
                      {dev.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              {/* ✅ Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.3,
                  borderRadius: "8px",
                  bgcolor: "var(--primary)",
                  color: "#000",
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                {editingTaskId ? "Update Task" : "Add Task"}
              </Button>
            </form>
          </Box>
        </Modal>

        {/* ---------------------- ASSIGNED TASKS ---------------------- */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--text-primary)",
              mb: 2.5,
              letterSpacing: "-0.01em",
            }}
          >
            Assigned Tasks
          </Typography>

          {tasks.length === 0 ? (
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
                  fontSize: "14px",
                }}
              >
                No tasks assigned yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {tasks.map((task) => (
                <Box
                  key={task._id}
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 0.8,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        fontSize: "15px",
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTask(task)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: "var(--text-secondary)",
                          "&:hover": {
                            bgcolor: "var(--bg-hover)",
                            color: "var(--primary)",
                          },
                        }}
                      >
                        <FontAwesomeIcon icon={faPenToSquare} size="sm" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTask(task._id)}
                        sx={{
                          width: 28,
                          height: 28,
                          color: "var(--text-secondary)",
                          "&:hover": {
                            bgcolor: "#fef2f2",
                            color: "var(--error)",
                          },
                        }}
                      >
                        <FontAwesomeIcon icon={faTrashCan} size="sm" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {task.assignedSubRole}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.3,
                        borderRadius: "5px",
                        bgcolor:
                          task.status === "Completed"
                            ? "#f0fdf4"
                            : task.status === "OnHold"
                              ? "#fef2f2"
                              : "#fef3c7",
                        border: `1px solid ${task.status === "Completed"
                            ? "#bbf7d0"
                            : task.status === "OnHold"
                              ? "#fecaca"
                              : "#fde68a"
                          }`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          fontSize: "11px",
                          color:
                            task.status === "Completed"
                              ? "var(--success)"
                              : task.status === "OnHold"
                                ? "var(--error)"
                                : "var(--warning)",
                        }}
                      >
                        {task.status}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* ---------------------- ATTENDANCE RECORDS ---------------------- */}
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--text-primary)",
              mb: 2.5,
              letterSpacing: "-0.01em",
            }}
          >
            Attendance Records
          </Typography>

          {/** State for attendance data */}
          {(() => {
            const [attendance, setAttendance] = React.useState<any[]>([]);
            const [loading, setLoading] = React.useState(true);

            React.useEffect(() => {
              const fetchAttendance = async () => {
                try {
                  const res = await api.get("/api/attendance/all");
                  setAttendance(res.data || []);
                } catch (err) {
                  console.error("Failed to fetch attendance:", err);
                } finally {
                  setLoading(false);
                }
              };

              fetchAttendance();
            }, []);

            if (loading)
              return (
                <Typography
                  sx={{
                    color: "var(--text-secondary)",
                    fontSize: "14px",
                  }}
                >
                  Loading...
                </Typography>
              );

            if (attendance.length === 0)
              return (
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
                      fontSize: "14px",
                    }}
                  >
                    No attendance records yet
                  </Typography>
                </Box>
              );

            return (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {attendance.map((record) => (
                  <Box
                    key={record._id}
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontSize: "15px",
                            mb: 0.3,
                          }}
                        >
                          {record.userId?.name || "Unknown User"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--text-secondary)",
                            fontSize: "12px",
                          }}
                        >
                          {record.userId?.subRole || "N/A"}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {record.punchOutTime ? (
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "5px",
                              bgcolor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: "11px",
                                color: "var(--success)",
                              }}
                            >
                              {Math.floor(record.duration / 3600)}h{" "}
                              {Math.floor((record.duration % 3600) / 60)}m
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: "5px",
                              bgcolor: "#fef3c7",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: "11px",
                                color: "var(--warning)",
                              }}
                            >
                              Active
                            </Typography>
                          </Box>
                        )}

                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAttendance(record._id)}
                          sx={{
                            width: 28,
                            height: 28,
                            color: "var(--text-secondary)",
                            "&:hover": {
                              bgcolor: "#fef2f2",
                              color: "var(--error)",
                            },
                          }}
                        >
                          <FontAwesomeIcon icon={faTrashCan} size="sm" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 3,
                        fontSize: "13px",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                      >
                        <FontAwesomeIcon
                          icon={faClock}
                          style={{
                            color: "var(--success)",
                            fontSize: "12px",
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                          }}
                        >
                          {new Date(record.punchInTime).toLocaleString(
                            "en-GB",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </Typography>
                      </Box>

                      {record.punchOutTime && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.8,
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faClock}
                            style={{
                              color: "var(--error)",
                              fontSize: "12px",
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: "var(--text-secondary)",
                              fontSize: "13px",
                            }}
                          >
                            {new Date(record.punchOutTime).toLocaleString(
                              "en-GB",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                              }
                            )}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          })()}
        </Box>

        {/* ---------------------- EMPLOYEES LIST ---------------------- */}
        <Box sx={{ mt: 5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--text-primary)",
              mb: 2.5,
              letterSpacing: "-0.01em",
            }}
          >
            Employees
          </Typography>

          {employees.length === 0 ? (
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
                  fontSize: "14px",
                }}
              >
                No employees yet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {employees.map((emp) => (
                <Box
                  key={emp._id}
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontSize: "15px",
                          mb: 0.3,
                        }}
                      >
                        {emp.name || "Unknown"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--text-secondary)",
                          fontSize: "12px",
                          display: "block",
                        }}
                      >
                        {emp.email}
                      </Typography>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1.5,
                          py: 0.3,
                          borderRadius: "5px",
                          bgcolor: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          mt: 0.8,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            fontSize: "11px",
                            color: "var(--success)",
                          }}
                        >
                          {emp.subRole}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteEmployee(emp._id)}
                      sx={{
                        width: 28,
                        height: 28,
                        color: "var(--text-secondary)",
                        "&:hover": {
                          bgcolor: "#fef2f2",
                          color: "var(--error)",
                        },
                      }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} size="sm" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
