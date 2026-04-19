import { useState, useRef } from "react";
import {
  Box, Typography, TextField, Button, Paper, Alert, Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckingData from "./CheckingData";
import { sendAnalysisData } from "../services/analysisService";
import type { ApiData } from "../pages/CandidatePage";

type FormData = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
};

type Props = {
  onAnalysisComplete: (data: ApiData) => void;
};

export default function FirstMassage({ onAnalysisComplete }: Props) {
  const [step, setStep] = useState<"form" | "loading">("form");
  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (field: keyof FormData, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const validate = () => {
    const newErrors: Partial<FormData> = {};
    if (!form.first_name) newErrors.first_name = "יש להזין שם פרטי";
    if (!form.last_name) newErrors.last_name = "יש להזין שם משפחה";
    if (!form.email || !form.email.includes("@")) newErrors.email = "מייל לא תקין";
    setErrors(newErrors);
    if (!audioFile) {
      setErrorMessage("יש להעלות הקלטת שיחה");
      return false;
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setStep("loading");
    setErrorMessage("");
    try {
      const result = await sendAnalysisData({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        audio_file: audioFile || undefined,
      });
      if (result.success && result.analysis) {
        onAnalysisComplete(result.analysis);
      } else {
        setErrorMessage("התקבלה תשובה לא תקינה מהשרת");
        setStep("form");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "שגיאה בשליחת הנתונים");
      setStep("form");
    }
  };

  if (step === "loading") return <CheckingData />;

  const fieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": { borderRadius: 3 },
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e53935" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#e53935" },
    "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#e53935" },
  };

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
          width: 420,
          p: 4,
          borderRadius: 4,
          border: "1px solid #e53935",
        }}
      >
        <Typography
          variant="h5"
          sx={{ textAlign: "center", mb: 3, color: "#c62828", fontWeight: "bold" }}
        >
          הרשמה למערכת
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>{errorMessage}</Alert>
        )}

        <TextField
          fullWidth label="שם פרטי" variant="outlined"
          value={form.first_name}
          onChange={(e) => handleChange("first_name", e.target.value)}
          error={!!errors.first_name} helperText={errors.first_name}
          sx={fieldSx}
        />

        <TextField
          fullWidth label="שם משפחה" variant="outlined"
          value={form.last_name}
          onChange={(e) => handleChange("last_name", e.target.value)}
          error={!!errors.last_name} helperText={errors.last_name}
          sx={fieldSx}
        />

        <TextField
          fullWidth label="מייל" variant="outlined"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={!!errors.email} helperText={errors.email}
          sx={fieldSx}
        />

        <TextField
          fullWidth label="טלפון (אופציונלי)" variant="outlined"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          sx={{ ...fieldSx, mb: 2 }}
        />

        {/* Audio upload */}
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
        />
        <Button
          fullWidth
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          sx={{
            mb: 1,
            py: 1.2,
            borderRadius: 3,
            borderColor: "#e53935",
            color: "#e53935",
            display: "flex",
            alignItems: "center",
            gap: 1,
            "&:hover": { borderColor: "#c62828", backgroundColor: "rgba(229,57,53,0.04)" },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 20 }} />
          העלאת הקלטת שיחה
        </Button>
        {audioFile && (
          <Chip
            label={audioFile.name}
            onDelete={() => { setAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            sx={{ mb: 2, width: "100%" }}
            color="success"
          />
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          sx={{
            mt: 1,
            backgroundColor: "#e53935",
            borderRadius: 3,
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#c62828" },
          }}
        >
          שליחה
        </Button>
      </Paper>
    </Box>
  );
}
