import { Box, Typography, Paper } from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

export default function NegativeMessage() {
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
        {/* אייקון */}
        <HighlightOffIcon
          sx={{
            fontSize: 50,
            color: "#e53935",
            mb: 2,
          }}
        />

        {/* כותרת */}
        <Typography
          variant="h5"
          sx={{
            color: "#e53935",
            fontWeight: "bold",
            mb: 2,
          }}
        >
          הנתונים נשמרו
        </Typography>

        {/* תיאור */}
        <Typography sx={{ color: "#555" }}>
          אם נרצה ניצור קשר
        </Typography>
      </Paper>
    </Box>
  );
}