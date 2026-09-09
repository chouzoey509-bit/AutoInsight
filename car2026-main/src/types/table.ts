/** 表格列配置（DataTable 公共组件使用） */
export interface TableColumn<R = Record<string, unknown>> {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  fixed?: 'left' | 'right' | boolean
  /** 自定义插槽名，默认取 prop */
  slot?: string
  formatter?: (row: R) => string
  showOverflowTooltip?: boolean
}
