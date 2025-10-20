import { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Paper, Alert } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

export default function LoginForm() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const navigate = useNavigate();

  // ✅ Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      const parsedUser = JSON.parse(user);
      if (parsedUser.role === "CEO") navigate("/dashboard");
      else navigate("/employee-dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setSuccess("Login successful ✅");

      const userRole = res.data.user.role;

      // ✅ Role ke hisaab se redirect
      if (userRole === "CEO") {
        navigate("/dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: "url('https://res.cloudinary.com/dpi82firq/image/upload/v1759334363/Sysovo_Company_Profile_5_v7kzah.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        padding: { xs: "15px", sm: "20px" },
        position: "relative",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4.5,
          width: "100%",
          maxWidth: 400,
          borderRadius: "12px",
          bgcolor: "var(--bg-surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)",
          position: "absolute",
          right: { xs: "50%", sm: "50%", md: "50%", lg: "10%", xl: "15%" },
          top: "50%",
          transform: { xs: "translate(50%, -50%)", sm: "translate(50%, -50%)", md: "translate(50%, -50%)", lg: "translate(0, -50%)", xl: "translate(0, -50%)" },
          "@media (max-width: 600px)": {
            maxWidth: "90%",
            p: 3,
          },
        }}
      >
        {/* Brand Logo */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 0,
          }}
        >
          <img
            src="https://res.cloudinary.com/dpi82firq/image/upload/v1759321173/Site_Icon_1_la1sm9.png"
            alt="Clockify Logo"
            style={{
              width: "80px",
              height: "80px",
            }}
          />
        </Box>

        <Typography
          variant="h5"
          sx={{
            textAlign: "center",
            fontWeight: 700,
            color: "var(--text-primary)",
            mb: 0.8,
            letterSpacing: "-0.02em"
          }}
        >
          Welcome Back
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            color: "var(--text-secondary)",
            mb: 3.5,
            fontSize: "13px"
          }}
        >
          Sign in to Sysovo
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
              "& .MuiAlert-icon": { color: "var(--error)" },
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
              "& .MuiAlert-icon": { color: "var(--success)" },
            }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="dense"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#2d2d2d",
                fontSize: "14px",
                "& fieldset": {
                  borderColor: "#444",
                },
                "&:hover fieldset": {
                  borderColor: "#666",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary)",
                  borderWidth: "1.5px",
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "14px",
                color: "#999",
                "&.Mui-focused": {
                  color: "var(--primary)",
                },
              },
              "& .MuiOutlinedInput-input": {
                color: "#fff",
              },
            }}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="dense"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 2.5,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                bgcolor: "#2d2d2d",
                fontSize: "14px",
                "& fieldset": {
                  borderColor: "#444",
                },
                "&:hover fieldset": {
                  borderColor: "#666",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "var(--primary)",
                  borderWidth: "1.5px",
                },
              },
              "& .MuiInputLabel-root": {
                fontSize: "14px",
                color: "#999",
                "&.Mui-focused": {
                  color: "var(--primary)",
                },
              },
              "& .MuiOutlinedInput-input": {
                color: "#fff",
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
              fontSize: "14px",
              textTransform: "none",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "var(--primary-hover)",
                boxShadow: "0 4px 16px rgba(204, 255, 0, 0.3)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Sign In
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
