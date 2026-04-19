type AnalysisPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  audio_file?: File;
};

export const sendAnalysisData = async (payload: AnalysisPayload) => {
  let response: Response;

  if (payload.audio_file) {
    const formData = new FormData();
    formData.append("first_name", payload.first_name);
    formData.append("last_name", payload.last_name);
    formData.append("email", payload.email);
    formData.append("phone", payload.phone || "");
    formData.append("audio_file", payload.audio_file);
    response = await fetch("/analyze_complete", { method: "POST", body: formData });
  } else {
    response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
      }),
    });
  }

  if (!response.ok) throw new Error(`שגיאה בשרת: ${response.status}`);
  return response.json();
};
