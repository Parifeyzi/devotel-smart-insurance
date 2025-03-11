export interface SubmissionData {
    id: string
    [key: string]: any
  }
  
  export interface SubmissionResponse {
    columns: string[]
    data: SubmissionData[]
  }