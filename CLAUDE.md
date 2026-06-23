# 代码规范

> 与项目概述有冲突时，以项目概述为准。

***

## 一、TypeScript 规范

### 1.1 组件类型使用 `React.FC` 声明

```tsx
// ✅
const DeviceList: React.FC<DeviceListProps> = () => { ... }

// ❌
const DeviceList = (props: DeviceListProps) => { ... }
```

### 1.2 可选属性优先使用 `?`，禁止 `string | undefined` 或 `string | null`

```ts
// ✅
interface DeviceProps {
  name: string;
  type?: string;
}

// ❌
interface DeviceProps {
  name: string;
  type: string | undefined;
  status: string | null;
}
```

### 1.3 非必要不得使用 `any`

```ts
// ✅
const parseConfig = (data: Record<string, unknown>) => { ... }

// ❌
const parseConfig = (data: any) => { ... }
```

### 1.4 多处引用的类型置于 `src/interface/` 下的 `.d.ts`；仅有限范围内使用的类型允许在自身文件内声明

```ts
// ✅ 多处引用 → src/interface/device.d.ts
interface DeviceInfo { ... }

// ✅ 仅 addModal 内使用 → addModal.tsx 内直接声明
interface AddModalProps {
  visible: boolean;
  onClose: () => void;
}

// ❌ 仅 addModal 内使用却单独建了 src/interface/addModal.d.ts
```

### 1.5 `.d.ts` 文件中严禁使用 ES6 `import/export` 语句

```ts
// ✅ src/interface/device.d.ts
interface DeviceInfo {
  id: string;
  name: string;
}

// ❌ src/interface/device.d.ts
import { Pagination } from './common';
export interface DeviceInfo { ... }
```

***

## 二、组件规范

### 2.1 使用函数式组件，不使用 `class` 组件

```tsx
// ✅
const DeviceList: React.FC = () => { ... }

// ❌
class DeviceList extends React.Component { ... }
```

### 2.2 不使用 `function` 声明函数，一律使用箭头函数

```tsx
// ✅
const DeviceList: React.FC = () => { ... }
const fetchList = async () => { ... }

// ❌
function DeviceList() { ... }
function fetchList() { ... }
```

### 2.3 `props` 不允许在函数声明中解构

```tsx
// ✅
const DeviceList: React.FC<DeviceListProps> = (props) => {
  const { name, type } = props;
  ...
}

// ❌
const DeviceList: React.FC<DeviceListProps> = ({ name, type }) => { ... }
```

### 2.4 组件代码结构顺序：变量 → `useState` → `useRef` → `useEffect` → 方法 → `return`

```tsx
// ✅
const DeviceList: React.FC<DeviceListProps> = () => {
  const defaultType = 'sensor';

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const tableRef = useRef(null);

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => { ... };

  const handleDelete = (id: string) => { ... };
  
  return <Table ... />;
};

// ❌
const DeviceList: React.FC<DeviceListProps> = () => {
  const [list, setList] = useState([]);
  const defaultType = 'sensor';
  const handleDelete = (id: string) => { ... };
  const tableRef = useRef(null);
  useEffect(() => { fetchList(); }, []);
  const [loading, setLoading] = useState(false);
  return <Table ... />;
  const fetchList = async () => { ... };
};
```

### 2.5 文件代码控制在 500 行内，原则上不超过 800 行；超过需分离组件，但不允许缩短变量名至无可读性

```tsx
// ✅ 超过 500 行时，将弹窗抽离为 addModal.tsx
// pages/deviceList/index.tsx      (~300 行)
// pages/deviceList/addModal.tsx   (~150 行)

// ❌ 为缩减行数将变量名缩写
const dl = [...];           // 应为 deviceList
const fcp = () => {};       // 应为 fetchCurrentPage
```

### 2.6 `components/` 下的组件目录一般只包括：`index.tsx`、`index.less`、`componentName.d.ts`

```
// ✅
components/searchForm/
├── index.tsx
├── index.less
└── searchForm.d.ts

// ❌ 非必要不出现
components/searchForm/
├── index.tsx
├── index.less
├── searchForm.d.ts
├── helper.ts
├── constants.ts
└── utils.ts
```

***

## 三、方法与命名规范

### 3.1 组件内方法需添加简短注释，原则上不多于一行

```tsx
// ✅
// 获取设备列表
const fetchList = async () => { ... }; 

// 删除设备
const handleDelete = (id: string) => { ... }; 

// ❌
/**
 * 获取设备列表
 * 该方法会调用 service 层的 deviceApis.fetchPage 接口
 * 传入当前分页参数和搜索条件
 * 返回结果会更新到 list 状态中
 */
const fetchList = async () => { ... };

// ❌ 无注释
const fetchList = async () => { ... };
```

### 3.2 工具函数需添加详细注释，包括功能说明、参数说明与返回值说明

```ts
// ✅
/**
 * 过滤表单中的空值
 * 遍历表单对象，移除值为空字符串、null、undefined 的字段
 * @param form - 待过滤的表单数据对象
 * @returns 去除空值后的新对象
 */
const filterEmptyFormV1 = (form: Record<string, unknown>) => { ... };

// ❌
const filterEmptyFormV1 = (form: Record<string, unknown>) => { ... };  // 过滤空值
```

### 3.3 方法命名尽可能简短；常用点击事件使用 `handleXxx` 命名

```tsx
// ✅
const fetchList = async () => { ... };
const handleClick = () => { ... };
const handleDelete = (id: string) => { ... };

// ❌
const fetchDeviceListDataFromServer = async () => { ... };
const onButtonClick = () => { ... };
const deleteItemById = (id: string) => { ... };
```

### 3.4 变量名不要太长，原则上不超过 15 个字符

```ts
// ✅
const deviceList = [];
const currentPage = 1;
const isModalOpen = false;

// ❌
const currentSelectedDeviceTypeList = [];  // 29 字符
const isAlarmRuleModalVisible = false;     // 25 字符
```

### 3.5 CSS 类名使用下划线拼接，尽可能简短

```less
// ✅
.device_list { ... }
.section_body { ... }
.alarm_item_status { ... }

// ❌
.deviceList { ... }          // 驼峰
.section-body { ... }        // 中划线
.alarm_item_status_icon_tag { ... }  // 过长
```

***

## 四、模块引入规范

### 4.1 引入顺序：React → 第三方库 → 自定义模块 → 样式；同类内按整句长度从长到短排列；超过 80 字符则拆分为多句引入，禁止在 `{}` 内换行

```tsx
// ✅
import React, { useState, useEffect, useRef } from 'react';
import { SearchForm, DrawerModal, Page, FormInput } from '@/components';
import { Preview, ColorPicker, StatusCell } from '@/components';
import { deviceApis, areaApis } from '@/service';
import { Table, Button, Modal } from 'antd';
import { filterEmptyFormV1 } from '@/util';
import './index.less';

// ❌ 顺序混乱
import './index.less';
import { SearchForm } from '@/components';
import React, { useState } from 'react';
import { Table } from 'antd';
import { deviceApis } from '@/service';

// ❌ 同类内未按长度排列
import { Modal, Button, Table } from 'antd';
import { deviceApis, areaApis } from '@/service';

// ❌ 超过 80 字符未拆分
import { SearchForm, DrawerModal, Page, FormInput, Preview, ColorPicker, StatusCell, AddModalSimple } from '@/components';

// ❌ 在 {} 内换行
import {
  SearchForm,
  DrawerModal,
  Page,
} from '@/components';
```

### 4.2 引入路径该合并合并、该简短简短

```tsx
// ✅
import { SearchForm, Page } from '@/components';

// ❌
import SearchForm from '@/components/searchForm';
import Page from '@/components/page';
```

### 4.3 `useState` 部分从长到短排列，能推断类型的不显式声明类型

```tsx
// ✅
const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [visible, setVisible] = useState(false);

// ❌
const [visible, setVisible] = useState<boolean>(false);
const [currentPage, setCurrentPage] = useState<number>(1);
const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
```

***

## 五、样式规范

### 5.1 Less 样式必须使用级联（嵌套）写法，严格按 DOM 层级逐级嵌套，每块样式之间隔一行

```less
// ✅
.device_list {
  padding: 12px;

  .device_item {
    display: flex;

    .device_name {
      font-size: 14px;
    }

    .device_status {
      color: @color_success;
    }
  }

  .device_pagination {
    margin-top: 16px;
  }
}

// ❌
.device_list { padding: 12px; }
.device_list .device_item { display: flex; }
.device_list .device_item .device_name { font-size: 14px; }
.device_list .device_item .device_status { color: @color_success; }
.device_list .device_pagination { margin-top: 16px; }

// ❌ 仅包裹一层后平铺
.device_list {
  .device_item { display: flex; }
  .device_name { font-size: 14px; }
  .device_status { color: @color_success; }
}
```

### 5.2 非必要不使用内联样式

```tsx
// ✅
<div className="device_item">

// ❌
<div style={{ display: 'flex', marginTop: 16 }}>
```

### 5.3 CSS 禁止使用 `gap` 属性

```less
// ✅
.device_item {
  .device_name {
    margin-right: 8px;
  }
}

// ❌
.device_item {
  display: flex;
  gap: 8px;
}
```

### 5.4 标准间距：`4px`、`8px`、`12px`、`16px`，`margin`、`padding` 从中取值

```less
// ✅
.device_item {
  margin-top: 12px;
  padding: 8px 16px;
}

// ❌
.device_item {
  margin-top: 10px;
  padding: 6px 15px;
}
```

### 5.5 优先使用 `funcCss.less` 中已有的功能类

```tsx
// ✅
<div className="margin-l-base">

// ❌
<div style={{ marginLeft: 8 }}>  /* margin-l-base可直接实现 */
```

### 5.6 Modal 类样式需注意其大概率不为当前页面顶级元素的子元素

```less
// ✅ Modal 挂载在 body 下，样式需写在全局或使用 :global
:global {
  .device_modal {
    .ant-modal-body { ... }
  }
}

// ❌ 以为 Modal 在当前页面容器内，样式写法无效
.device_list {
  .device_modal {
    .ant-modal-body { ... }
  }
}
```

### 5.7 `img` 标签不需要 `alt` 属性

```tsx
// ✅
<img src={deviceIcon} />

// ❌
<img src={deviceIcon} alt="device icon" />
```

***

## 六、国际化规范

### 6.1 缺少国际化文本时直接补齐，禁止使用 `.d()` 进行占位

```tsx
// ✅
intl.get('deviceList.deviceName')

// ❌
intl.get('deviceList.deviceName').d('设备名称')
```

***

## 七、其他规范

### 7.1 使用 `async/await` 代替 Promise 链式调用

```ts
// ✅
const fetchList = async () => {
  try {
    const res = await deviceApis.fetchPage(params);
    setList(res.data);
  } catch (err) {
    console.error(err);
  }
};

// ❌
const fetchList = () => {
  deviceApis.fetchPage(params)
    .then(res => setList(res.data))
    .catch(err => console.error(err));
};
```

### 7.2 工具方法统一置于 `util/` 中并从 `@/util` 引入

```tsx
// ✅
import { filterEmptyFormV1 } from '@/util';

// ❌
const filterEmptyFormV1 = (form: Record<string, unknown>) => { ... };  // 页面内自行实现
```

