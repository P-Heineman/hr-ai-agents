import { Box, Typography, Paper } from "@mui/material";

export default function SuccessMessage() {
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
          variant="h5"
          sx={{
            color: "#2e7d32",
            fontWeight: "bold",
            mb: 2,
          }}
        >
          ✔ הנתונים נשמרו בהצלחה
        </Typography>

        <Typography sx={{ color: "#555" }}>
          נדבר בהמשך...
        </Typography>
      </Paper>
    </Box>
  );
}