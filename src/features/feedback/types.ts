export type HomepageFeedbackDraft = {
  rating: number;
  message: string;
  email?: string;
  pagePath: string;
};

export type HomepageFeedback = HomepageFeedbackDraft & {
  id?: string;
  submittedAt: string;
};
