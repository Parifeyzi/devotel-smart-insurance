import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Table, Spin, message } from "antd"
import type { SortOrder } from "antd/es/table/interface"
import { getSubmissions } from "../services/api"
import { useTranslation } from "react-i18next"
import { SubmissionData, SubmissionResponse } from "../types/submissionTypes"

const SORT_DIRECTIONS: SortOrder[] = ["ascend", "descend"]

export default function SubmissionListPage() {
  const { t } = useTranslation()
  const { data, error, isLoading } = useQuery<SubmissionResponse>({
    queryKey: ["submissions"],
    queryFn: getSubmissions,
  })
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  useEffect(() => {
    if (data && data.columns?.length && selectedColumns.length === 0) {
      setSelectedColumns(["index", ...data.columns])
    }
  }, [data, selectedColumns])

  if (isLoading) {
    return <Spin tip={t("loadingSubmissions")} style={{ margin: 24 }} />
  }
  if (error) {
    message.error(t("failedToLoadSubmissions"))
    return null
  }
  if (!data) return null

  const serverColumns = data.columns || []
  const allColumns = ["index", ...serverColumns]
  const tableData = data.data.map((item, i) => ({
    ...item,
    index: i + 1,
  }))

  const columns = selectedColumns.map((col: string) => ({
    title: col,
    dataIndex: col,
    key: col,
    sorter: (a: SubmissionData, b: SubmissionData) =>
      col === "index"
        ? a.index - b.index
        : `${a[col]}`.localeCompare(`${b[col]}`),
    sortDirections: SORT_DIRECTIONS,
  }))

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">{t("submittedApplications")}</h1>
      <div className="mb-4 flex flex-wrap items-center space-x-2 space-y-2">
        <span className="mr-2">{t("columns")}:</span>
        {allColumns.map((c) => {
          const checked = selectedColumns.includes(c)
          return (
            <label key={c} className="mr-2">
              <input
                type="checkbox"
                className="mr-1"
                checked={checked}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns((prev) => [...prev, c])
                  } else {
                    setSelectedColumns((prev) => prev.filter((x) => x !== c))
                  }
                }}
              />
              {c}
            </label>
          )
        })}
      </div>
      <div className="overflow-x-auto">
        <Table
          dataSource={tableData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  )
}