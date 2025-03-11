export interface DynamicOptions {
    dependsOn: string;
    endpoint: string;
    method: string;
  }
  
  export interface Visibility {
    dependsOn: string;
    condition: "equals" | "not_equals";
    value: string;
  }
  
  export interface Validation {
    min?: number;
    max?: number;
    pattern?: string;
  }
  
  export interface BaseField {
    id: string;
    label: string;
    required?: boolean;
    options?: string[];
    dynamicOptions?: DynamicOptions;
    visibility?: Visibility;
    validation?: Validation;
  }
  
  export interface SimpleField extends BaseField {
    type: "text" | "number" | "date" | "select" | "radio" | "checkbox";
  }
  
  export interface GroupField {
    id: string;
    label: string;
    type: "group";
    fields: SimpleField[];
  }
  
  export type FieldItem = SimpleField | GroupField;
  
  export interface FormStructure {
    formId: string;
    title: string;
    fields: FieldItem[];
  }