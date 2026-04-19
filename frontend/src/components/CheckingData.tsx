import { Box, Typography, CircularProgress, Paper } from "@mui/material";

export default function CheckingData() {
  return (
    <Box
      dir="rtl"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: 400,
          p: 4,
          borderRadius: 4,
          border: "1px solid #e53935",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 3, color: "#c62828", fontWeight: "bold" }}
        >
          מנתחים את הנתונים...
        </Typography>

        <CircularProgress sx={{ color: "#e53935" }} />

        <Typography sx={{ mt: 2, fontSize: 13, color: "#999" }}>
          התהליך עשוי לקחת עד דקה
        </Typography>
      </Paper>
    </Box>
  );
}
