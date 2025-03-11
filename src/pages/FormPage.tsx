import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  DatePicker,
  Button,
  Row,
  Col,
  FormInstance,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import { getDynamicForm, submitFormData, api } from "../services/api";
import { useTranslation } from "react-i18next";
import {
  FormStructure,
  FieldItem,
  GroupField,
  SimpleField,
} from "../types/formTypes";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Check if a field item is of type "group".
 */
function isGroup(item: FieldItem): item is GroupField {
  return item.type === "group";
}

/**
 * A draggable container wrapper that includes a small handle at the top-right.
 * Wrap any rendered item in SortableItem to enable drag-and-drop functionality.
 */
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    marginBottom: 16,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        {...attributes}
        {...listeners}
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 18,
          height: 18,
          borderRadius: 4,
          background: "#ccc",
          cursor: "grab",
          zIndex: 10,
        }}
      />
      {children}
    </div>
  );
}

export default function DynamicFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Clear localStorage on every page refresh
  useEffect(() => {
    localStorage.clear();
  }, []);

  // Fetch all dynamic forms (including additional security system fields)
  const { data: forms, error, isLoading } = useQuery<FormStructure[]>({
    queryKey: ["dynamicForms"],
    queryFn: getDynamicForm,
  });

  const [selectedForm, setSelectedForm] = useState<FormStructure | null>(null);
  const [form] = Form.useForm();

  // Use useWatch to get the current form values for reactive visibility checks.
  const formValues = Form.useWatch([], form);

  // Store dynamic options (e.g., state options) loaded when the country changes.
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, string[]>>({});

  const [submitting, setSubmitting] = useState(false);

  /**
   * Determines if a field should be displayed.
   * Each field can have its own visibility condition that depends on another field’s value.
   * For example, if a field has visibility set to:
   *   { dependsOn: "smoker", condition: "equals", value: "Yes" },
   * then it is shown only when the value of "smoker" is "Yes".
   */
  const shouldShowField = (field: SimpleField, values: Record<string, any>) => {
    if (!field.visibility) return true;
    const dependsValue = values[field.visibility.dependsOn];
    if (field.visibility.condition === "equals") {
      return dependsValue === field.visibility.value;
    }
    if (field.visibility.condition === "not_equals") {
      return dependsValue !== field.visibility.value;
    }
    return true;
  };

  /**
   * Loads state options from the server when the country changes.
   */
  const handleCountryChange = async (val: string) => {
    if (!val) {
      setDynamicOptions((prev) => ({ ...prev, state: [] }));
      return;
    }
    try {
      const res = await api.get("/getStates", { params: { country: val } });
      if (Array.isArray(res.data.states)) {
        setDynamicOptions((prev) => ({ ...prev, state: res.data.states }));
      } else {
        setDynamicOptions((prev) => ({ ...prev, state: [] }));
      }
    } catch {
      setDynamicOptions((prev) => ({ ...prev, state: [] }));
    }
  };

  /**
   * Triggered when any form field changes.
   * If the "country" field changes, it updates the state options.
   * Additionally, it saves the current form values as a draft in localStorage.
   */
  const onValuesChange = async (
    changed: Record<string, any>,
    allValues: Record<string, any>
  ) => {
    const changedKey = Object.keys(changed)[0];
    if (!changedKey) return;

    if (changedKey === "country") {
      await handleCountryChange(changed[changedKey]);
    }

    if (selectedForm) {
      localStorage.setItem(`draft_${selectedForm.formId}`, JSON.stringify(allValues));
    }
  };

  /**
   * When the form is submitted, first validate the required fields (only those whose visibility condition is met)
   * then send the form data to the server.
   */
  const onFinish = async (values: Record<string, any>) => {
    if (!selectedForm) return;

    // Collect all simple fields from both top-level and group fields.
    const allSimpleFields: SimpleField[] = [];
    selectedForm.fields.forEach((item) => {
      if (isGroup(item)) {
        allSimpleFields.push(...item.fields);
      } else {
        allSimpleFields.push(item);
      }
    });

    // Validate required fields based on their visibility.
    const missing: string[] = [];
    allSimpleFields.forEach((fld) => {
      if (fld.required && shouldShowField(fld, formValues)) {
        if (!formValues[fld.id]) missing.push(fld.id);
      }
    });

    if (missing.length > 0) {
      missing.forEach((mf) => {
        form.setFields([{ name: mf, errors: [t("required")] }]);
      });
      return;
    }

    try {
      setSubmitting(true);
      await submitFormData(values);
      message.success(t("formSubmittedSuccess"));
      navigate("/submissions");
    } catch (err) {
      message.error(t("submissionFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Loads any saved draft from localStorage when a form is selected.
   */
  useEffect(() => {
    if (selectedForm) {
      const savedDraft = localStorage.getItem(`draft_${selectedForm.formId}`);
      if (savedDraft) {
        try {
          form.setFieldsValue(JSON.parse(savedDraft));
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [selectedForm, form]);

  /**
   * Handles drag-and-drop reordering for top-level form items (both groups and simple fields).
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !selectedForm || active.id === over.id) return;

    const oldIndex = selectedForm.fields.findIndex((f) => f.id === active.id);
    const newIndex = selectedForm.fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const updatedFields = arrayMove(selectedForm.fields, oldIndex, newIndex);
    setSelectedForm({ ...selectedForm, fields: updatedFields });
  };

  if (isLoading) {
    return <p>{t("loadingForms")}</p>;
  }
  if (error) {
    return <p>{t("failedToLoadForms")}</p>;
  }
  if (!forms) {
    return null;
  }

  return (
    <Row justify="center" className="p-6">
      <Col xs={24} md={18} lg={12}>
        <h1 className="text-2xl font-bold mb-4">{t("smartInsuranceForms")}</h1>
        <Select
          className="w-full mb-6"
          placeholder={t("selectAForm")}
          onChange={(val) => {
            const f = forms.find((x) => x.formId === val) || null;
            setSelectedForm(f);
            form.resetFields();
            setDynamicOptions({});
          }}
        >
          {forms.map((f) => (
            <Select.Option key={f.formId} value={f.formId}>
              {f.title}
            </Select.Option>
          ))}
        </Select>

        {selectedForm && (
          <Form
            form={form}
            layout="vertical"
            onValuesChange={onValuesChange}
            onFinish={onFinish}
            className="bg-white dark:bg-gray-800 p-4 rounded-md"
          >
            <h2 className="text-lg font-bold mb-4">{selectedForm.title}</h2>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={selectedForm.fields.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {selectedForm.fields.map((item) => {
                  // For a group field, render only if at least one sub-field meets its visibility condition.
                  if (isGroup(item)) {
                    const visibleSubFields = item.fields.filter((f) =>
                      shouldShowField(f, formValues)
                    );
                    if (visibleSubFields.length === 0) {
                      return null;
                    }
                    return (
                      <SortableItem key={item.id} id={item.id}>
                        <div
                          className="border border-gray-300 dark:border-gray-600 rounded-md p-4 mb-4"
                          style={{ position: "relative" }}
                        >
                          <h3 className="text-base font-medium mb-3">{item.label}</h3>
                          {visibleSubFields.map((subField) => (
                            <FieldRenderer
                              key={subField.id}
                              field={subField}
                              formInstance={form}
                              t={t}
                              dynamicOptions={dynamicOptions}
                              shouldShowField={shouldShowField}
                            />
                          ))}
                        </div>
                      </SortableItem>
                    );
                  } else {
                    // For a simple field, render only if its own visibility condition is met.
                    if (!shouldShowField(item as SimpleField, formValues)) {
                      return null;
                    }
                    return (
                      <SortableItem key={item.id} id={item.id}>
                        <div
                          className="border border-gray-300 dark:border-gray-600 rounded-md p-4 mb-4"
                          style={{ position: "relative" }}
                        >
                          <FieldRenderer
                            field={item as SimpleField}
                            formInstance={form}
                            t={t}
                            dynamicOptions={dynamicOptions}
                            shouldShowField={shouldShowField}
                          />
                        </div>
                      </SortableItem>
                    );
                  }
                })}
              </SortableContext>
            </DndContext>
            <Form.Item className="mt-4">
              <Button type="primary" htmlType="submit" loading={submitting}>
                {t("submit")}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Col>
    </Row>
  );
}

/**
 * Renders an individual form field (text, number, date, select, radio, checkbox)
 * with support for dynamic options (such as country/state).
 * Each field is rendered only if its specific visibility condition is met.
 */
function FieldRenderer({
  field,
  formInstance,
  t,
  dynamicOptions,
  shouldShowField,
}: {
  field: SimpleField;
  formInstance: FormInstance;
  t: (key: string) => string;
  dynamicOptions: Record<string, string[]>;
  shouldShowField: (field: SimpleField, vals: Record<string, any>) => boolean;
}) {
  const rules = field.required ? [{ required: true, message: t("required") }] : [];
  const vals = formInstance.getFieldsValue();

  // Render the country field without any additional visibility condition.
  if (field.id === "country") {
    return (
      <Form.Item name="country" label={t("country")} className="mb-4" rules={rules}>
        <Select>
          <Select.Option value="">{t("selectAnOption")}</Select.Option>
          {(field.options || []).map((o) => (
            <Select.Option key={o} value={o}>
              {o}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
  }
  // Render the state field only if a country has been selected.
  if (field.id === "state") {
    if (!vals.country) return null;
    return (
      <Form.Item name="state" label={t("state")} className="mb-4" rules={rules}>
        <Select>
          <Select.Option value="">{t("selectAnOption")}</Select.Option>
          {(dynamicOptions.state || field.options || []).map((o) => (
            <Select.Option key={o} value={o}>
              {o}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    );
  }

  // Render other field types normally based on their type.
  switch (field.type) {
    case "text":
      return (
        <Form.Item name={field.id} label={field.label} className="mb-4" rules={rules}>
          <Input />
        </Form.Item>
      );
    case "number":
      return (
        <Form.Item name={field.id} label={field.label} className="mb-4" rules={rules}>
          <InputNumber
            className="w-full"
            min={field.validation?.min}
            max={field.validation?.max}
          />
        </Form.Item>
      );
    case "date":
      return (
        <Form.Item name={field.id} label={field.label} className="mb-4" rules={rules}>
          <DatePicker className="w-full" />
        </Form.Item>
      );
    case "select":
      return (
        <Form.Item name={field.id} label={field.label} className="mb-4" rules={rules}>
          <Select>
            <Select.Option value="">{t("selectAnOption")}</Select.Option>
            {(field.options || []).map((o) => (
              <Select.Option key={o} value={o}>
                {o}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      );
    case "radio":
      return (
        <Form.Item name={field.id} label={field.label} className="mb-4" rules={rules}>
          <Radio.Group>
            {field.options?.map((o) => (
              <Radio key={o} value={o}>
                {o}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      );
    case "checkbox":
      return (
        <Form.Item
          name={field.id}
          label={field.label}
          className="mb-4"
          rules={rules}
          valuePropName="checked"
        >
          <Checkbox.Group options={field.options || []} />
        </Form.Item>
      );
    default:
      return null;
  }
}