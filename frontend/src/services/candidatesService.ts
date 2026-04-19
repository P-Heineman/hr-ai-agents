export type CandidateAnalysisPayload = {
  social_profile: {
    analysis_result: {
      candidate_name: string;
      summary: string;
    };
  };
  interaction_profile: {
    scores: {
      communication_score: number;
      confidence_score: number;
    };
    qualitative_data: {
      ai_insight: string;
    };
  };
};

export type CandidateResponse = {
  success: boolean;
  candidate_name: string;
  analysis: {
    dashboard_view: {
      full_name: string;
      email: string;
      phone: string;
      match_percent: number;
      status: string;
    };
    interview_details: {
      graph: Record<string, number>;
      strengths: string[];
      weaker_points: string[];
      score_reasons: string[];
    };
  };
};

export const fetchCandidatesList = async (): Promise<CandidateResponse[]> => {
  const response = await fetch("/candidates", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`שגיאה בשרת: ${response.statusText}`);
  }

  return response.json();
};

export const analyzeCandidateProfile = async (
  payload: CandidateAnalysisPayload
): Promise<CandidateResponse> => {
  const response = await fetch("/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`שגיאה בשרת: ${response.statusText}`);
  }

  return response.json();
};
