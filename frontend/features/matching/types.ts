export type MatchPartner = {
  role: string | null;
  specialization: string | null;
  experience: string | null;
  domainArea: string | null;
};

export type MatchingResponse = {
  message: string;
  data: {
    matched: boolean;
    matchScore: number;
    partner: MatchPartner | null;
  };
};
