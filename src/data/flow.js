/**
 * 01-00 · 流程化 · 销售端工程细节对齐
 *
 * 依据两份报表整理客户需求的真实结构：
 *   500413 / 500425「Customer requirement assessment」（客户需求评估表）
 *   1. Project introduction → 2. Application information → 3. Specifications(3.1~3.5)
 *   → 4. Other → 5. Feasibility assessment
 * 参考资料：EW000970173_CAHB20E_Rev1.1.pdf、EW000970459_CAHB22E_Rev1.1.pdf（CAHB-20 / CAHB-22 电动推杆规格图）
 *
 * 角色分工：
 *   系统 —— 读懂客户原话与附件，替销售起草并补齐 500413 每一节，缺项主动追问销售
 *   销售 —— 确认系统给出的值、补充客户口述里没有的信息
 *   AE   —— 把「客户原文」与「销售整理后的报表」逐条对照做二次确认；
 *           有理解差异时勾选问题，由系统统一发给客户
 *   客户 —— 回答系统发过去的问题
 * 结果：客户 / 销售 / AE 三方都已确认的对齐确认单，系统负责融合与归档
 */

export const engineeringFlow = {
  /** 本次流程用到的四份资料 */
  docs: [
    { code: '500413', name: 'Customer requirement assessment', meta: 'R02 · 已填' },
    { code: '500425', name: 'Customer requirement assessment', meta: 'R01 · 模板' },
    { code: 'EW000970173', name: 'CAHB-20 系列规格图', meta: 'Rev 1.1' },
    { code: 'EW000970459', name: 'CAHB-22 系列规格图', meta: 'Rev 1.1' },
  ],

  /** 报表章节（用于左侧“报表结构”导航） */
  formSections: [
    {
      no: '1',
      title: 'Project introduction',
      zh: '项目介绍',
      hint: 'iCRM ID, timing plan, volume, target SC, etc.',
    },
    {
      no: '2',
      title: 'Application information',
      zh: '应用信息',
      hint: 'application picture, function description, environment description, frequency of use, life expectancy, etc.',
    },
    {
      no: '3',
      title: 'Specifications',
      zh: '规格',
      hint: '3.1 Performance / 3.2 Functions / 3.3 Installation interface / 3.4 Tests / 3.5 Certification',
      subs: [
        {
          no: '3.1',
          title: 'Performance',
          zh: '性能',
          hint: 'input voltage, current draw, output force, static load, speed, acceleration, duty cycle, etc.',
        },
        {
          no: '3.2',
          title: 'Functions',
          zh: '功能',
          hint: 'sensor signal feedback, limit switch, communications protocol, manual override, emergency lowering, anti-pinching, back-up nut, self-locking, back drive, etc.',
        },
        {
          no: '3.3',
          title: 'Installation interface',
          zh: '安装接口',
          hint: 'space dimension, stroke length, retracted length, front/rear attachment, cable length, connector, Pin definition, etc.',
        },
        {
          no: '3.4',
          title: 'Tests',
          zh: '测试',
          hint: 'temperature, vibration, shock, EMC, life, corrosion, IP level, noise level, etc.',
        },
        {
          no: '3.5',
          title: 'Certification',
          zh: '认证',
          hint: 'CE mark, UL mark, etc.',
        },
      ],
    },
    {
      no: '4',
      title: 'Other',
      zh: '其他',
      hint: 'export control, packaging, labeling, spare parts, etc.',
    },
    {
      no: '5',
      title: 'Feasibility assessment',
      zh: '可行性评估',
      hint: 'Feasible: customization based on which model type; customized point / Not feasible: reason',
    },
  ],

  /** 流程步骤 */
  steps: [
    {
      no: '01',
      time: '09:31',
      title: '系统读取客户原话与附件，起草 500413',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '1. Project introduction',
        hint: '(iCRM ID, timing plan, volume, target SC, etc.)',
        fields: [
          ['iCRM ID', 'iCRM-2026-0451（系统从 01 区带出）'],
          ['客户', '越野机器人客户（王工）'],
          ['项目', '自主机器人转向执行机构 · 推杆换型'],
          ['timing plan', '样件 8 周 → 小批 12 周 → SOP 22 周（系统按产能日历建议）'],
          ['volume', 'EAU 50 pcs（客户原话）'],
          ['target SC', '目标单价 ≤ ￥1,850（客户原话）'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:31',
          text: '已读取第 01 区的客户原话 + 4 份附件，按 500413 起草了 6 个字段：iCRM、客户、项目直接从系统带出；timing plan 我按产能日历给了建议值；volume 与 target SC 取自客户原话。请确认。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:32',
          text: 'timing plan 客户只说了「样件 6 周」，我按你说的 8 周报？还是按客户口径写 6 周？',
        },
        {
          role: 'bot',
          name: '需求系统 · 09:32',
          text: '建议写 8 周，并在备注里注明「客户期望 6 周，含 CANopen 控制板打样」。这样后续 AE 复核与报价都有依据。',
        },
      ],
    },
    {
      no: '02',
      time: '09:35',
      title: '系统补齐 2 Application information',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '2. Application information',
        hint: '(application picture, function description, environment description, frequency of use, life expectancy, etc.)',
        fields: [
          ['application picture', '客户现场照片 ×2（附件 att-5，系统已挂接）'],
          ['function description', 'off road autonomous robot，actuator 用于 steering wheel control'],
          ['environment description', '户外越野：粉尘 / 泥水 / 强振动（客户原话）'],
          ['frequency of use', '每班约 400 次往复 · 两班制（系统按客户节拍推算）'],
          ['life expectancy', '整机 5 年 / 推杆往复 ≥ 60 万次（客户原话）'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:35',
          text: '第 2 节客户原话只写了「户外 / 越野 / 粉尘泥水」，我按附件里的现场照片补了「强振动」，并按客户节拍推算了使用频次（每班 400 次、两班制）。这两项需要你确认是否符合客户实际。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:36',
          text: '频次对，客户说两班倒、每班 400 次左右。强振动也对，他们跑的都是碎石路。',
        },
      ],
    },
    {
      no: '03',
      time: '09:39',
      title: '3.1 Performance：系统给出建议值，销售确认',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '3.1 Performance',
        hint: '(input voltage, current draw, output force, static load, speed, acceleration, duty cycle, etc.)',
        fields: [
          ['input voltage', '48 V DC（40~55 V）—— 客户原话「48V 平台」'],
          ['output force', '额定 3,500 N / 峰值 4,500 N —— 客户原话'],
          ['speed', '37 mm/s（系统按 CAHB-22 标准值填，客户要求 ≥ 30 mm/s）'],
          ['duty cycle', '20%（85 s on / 340 s off）—— 沿用平台标准'],
          ['current draw', '额定 ≤ 6 A —— 摘自 EW000970459'],
          ['static load', '⚠ 客户未提供，系统标记为待确认'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:39',
          text: '3.1 里 5 项能从客户原话或 CAHB-22 规格图直接取到；只有 static load 客户没说，我先空着并在报表里标了待确认——这一项 AE 复核时一定会问，建议提前问客户。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:40',
          text: '速度写 37 客户会不会觉得超配？他们只要 30。',
        },
        {
          role: 'bot',
          name: '需求系统 · 09:40',
          text: '37 mm/s 是 CAHB-22 的标准值，写标准值更稳；若客户坚持 30，后续用控制板限速即可，不影响选型。',
        },
      ],
    },
    {
      no: '04',
      time: '09:43',
      title: '3.2 Functions / 3.3 Installation interface',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '3.2 Functions · 3.3 Installation interface',
        hint: '(sensor signal feedback, limit switch, communications protocol, self-locking… / space dimension, stroke length, retracted length, front/rear attachment, cable length, connector, Pin definition…)',
        fields: [
          ['sensor signal feedback', '绝对位置反馈 0~5 V（22 系列选配）'],
          ['communications protocol', 'CANopen（客户主控要求）'],
          ['limit switch / self-locking', '内置限位 + 外部急停；自锁 + 后备螺母'],
          ['stroke / retracted length', '行程 50 mm；缩回长 ≈ 366 mm（EW000970459）'],
          ['front/rear attachment', '前叉耳 ⌀12.2 H11 / 后耳环 10 H11'],
          ['cable / connector', '线长 1.5 m；M12 A 编码 4 芯'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:43',
          text: '3.2 / 3.3 已填。从这里能看出 3 个定制点：CANopen 控制板、M12 四芯线束、绝对位置反馈——我已在报表里加「定制点」标记，AE 复核时会用到。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:44',
          text: '这三个定制点客户提过，可以写。线长 1.5 米也是他们线束标准。',
        },
      ],
    },
    {
      no: '05',
      time: '09:47',
      title: '3.4 Tests / 3.5 Certification',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '3.4 Tests · 3.5 Certification',
        hint: '(temperature, vibration, shock, EMC, life, corrosion, IP level, noise level / CE mark, UL mark…)',
        fields: [
          ['temperature', '⚠ 客户说 -20~60 ℃，平台标准 -40/+85 ℃ —— 系统标记口径差异'],
          ['vibration / shock', '随机振动 5~500 Hz；冲击 30 g / 11 ms'],
          ['EMC', 'EN 61000-6-2 / -6-4'],
          ['life', '往复 60 万次（客户整机 5 年）'],
          ['IP level / noise', 'IP66M / IP69K；≤ 65 dB(A) @1 m'],
          ['certification', 'CE；UL 暂不要求（客户原话「UL 先不做」）'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:47',
          text: '3.4 的 temperature 有口径差异：客户说 -20~60 ℃，我们平台是 -40/+85 ℃。我按平台标准填了，但标注「与客户口径不一致」——这条留给 AE 判断要不要问客户。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:48',
          text: '行，你标着，让 AE 定。认证就 CE，UL 客户明确说不要。',
        },
      ],
    },
    {
      no: '06',
      time: '09:51',
      title: '4. Other：系统补边界与假设',
      owner: '系统 + 销售',
      form: {
        code: '500413',
        section: '4. Other',
        hint: 'export control, packaging, labeling, spare parts, etc.',
        fields: [
          ['export control', '⚠ 终端在境外 → 系统自动加「需合规初筛（ECCN 初判）」'],
          ['packaging', '单件气泡膜 + 纸箱（10 件/箱）—— 系统按客户出货习惯建议'],
          ['labeling', '图号 + 批次 + 序列号激光打标'],
          ['spare parts', '首批随货 2 件备件'],
          ['假设', 'UL 不做；对接尺寸以客户 3D 数模为准；量价基于 EAU 50 pcs'],
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:51',
          text: '4. Other 我补了三条边界：出口管制初筛（终端在境外自动触发）、包装规格、备件；另外把「UL 不做 / 量价按 EAU 50」写成假设条款，避免后面扯皮。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 09:52',
          text: '可以。包装就按 10 件一箱。',
        },
      ],
    },
    {
      no: '07',
      time: '09:55',
      title: '系统提交 AE 复核：原文 vs 报表逐条对照',
      owner: 'AE · 二次确认',
      review: {
        hint: 'AE 逐条对照「客户原文」与「销售整理值」：一致的点「确认」，有差异或信息缺失的点「询问客户」，由系统统一发出问题。',
        rows: [
          {
            id: 'r1',
            field: '3.1 input voltage',
            customer: '「电池是 48V 平台」',
            sales: '48 V DC（40~55 V）',
            ae: '一致 · 确认',
            state: 'ok',
          },
          {
            id: 'r2',
            field: '3.1 output force',
            customer: '「额定推力 3500N、峰值 4500N」',
            sales: '3,500 N / 4,500 N',
            ae: '一致 · 确认',
            state: 'ok',
          },
          {
            id: 'r3',
            field: '3.1 static load',
            customer: '未提及',
            sales: '⚠ 待确认（空）',
            ae: '信息缺失 · 需询问',
            state: 'ask',
          },
          {
            id: 'r4',
            field: '3.1 speed',
            customer: '「30mm/s 以上」',
            sales: '37 mm/s（CAHB-22 标准值）',
            ae: '高于要求 · 可确认',
            state: 'ok',
          },
          {
            id: 'r5',
            field: '3.3 密封槽',
            customer: '「原来的老是渗油」（未给尺寸）',
            sales: '2×1.5（平台标准）',
            ae: '客户未指定 · 需询问',
            state: 'ask',
          },
          {
            id: 'r6',
            field: '3.4 temperature',
            customer: '「-20 到 60 度」',
            sales: '-40 / +85 ℃（平台标准）',
            ae: '口径不一致 · 需询问',
            state: 'ask',
          },
          {
            id: 'r7',
            field: '3.5 certification',
            customer: '「CE 就行，UL 先不做」',
            sales: 'CE；UL 暂不要求',
            ae: '一致 · 确认',
            state: 'ok',
          },
        ],
        questions: [
          { id: 'q1', rowId: 'r3', text: '静态载荷要求是多少？（整机急停时的最大载荷）' },
          { id: 'q2', rowId: 'r5', text: '密封槽尺寸按 2×1.5 还是 3×2？' },
          { id: 'q3', rowId: 'r6', text: '工作温度：按实际 -20~60 ℃，还是按平台标准 -40/+85 ℃ 做？' },
        ],
      },
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 09:55',
          text: '500413 已由销售确认完毕，转 AE 复核。我把每一行都做了「客户原文 / 销售整理值」对照，并预先标出 3 处需要 AE 判断的地方。',
        },
        {
          role: 'eng',
          name: 'AE · 李工 · 09:56',
          text: '对照看过了：电压、推力、速度、认证四项可以确认；static load、密封槽、温度这三项跟客户原文对不上或缺失，我勾上「询问客户」，麻烦系统统一发过去。',
        },
      ],
    },
    {
      no: '08',
      time: '10:01',
      title: '系统发出询问 · 客户答复回传',
      owner: '系统 + 客户',
      answers: [
        { q: '静态载荷要求是多少？', a: '整机急停时最大静态载荷约 6,000 N' },
        { q: '密封槽尺寸按 2×1.5 还是 3×2？', a: '按旧图的 2×1.5，不要改' },
        { q: '工作温度按实际 -20~60 ℃ 还是平台标准？', a: '-20~60 是实际使用范围，按平台标准做更稳妥，我们接受' },
      ],
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 10:01',
          text: '已把 3 个问题合并成一条确认单发给客户（微信 + 邮件），客户 10:01 全部答复。系统已回填 500413：static load 6,000 N、密封槽 2×1.5、温度按平台标准。',
        },
        {
          role: 'customer',
          name: '客户 · 王工 · 10:01',
          text: '三个都回了。静态载荷按 6000N 算；密封槽就按旧图 2×1.5；温度你们按标准做没问题。',
        },
        {
          role: 'eng',
          name: 'AE · 李工 · 10:02',
          text: '收到，6,000 N 需要按 CAHB-22 曲线校核一下，可能要加强壳体，我写进可行性评估。',
        },
      ],
    },
    {
      no: '09',
      time: '10:05',
      title: '5. Feasibility assessment',
      owner: 'AE',
      form: {
        code: '500413',
        section: '5. Feasibility assessment',
        hint: '(Feasible: customization based on which model type; customized point / Not feasible: reason. e.g. Export control, lead time, cost, technical features)',
        fields: [
          ['结论', '☒ Feasible　☐ Not feasible'],
          ['customization base', 'CAHB-22-D2E（EW000970459：48 V / 3,500 N / 37 mm/s / 行程 50）'],
          ['customized point ①', '控制板改 CANopen + 绝对位置反馈输出'],
          ['customized point ②', '连接器改 M12 A 编码 4 芯，线长 1.5 m'],
          ['customized point ③', '静态载荷 6,000 N 校核（不足则加强壳体，成本 +8%）'],
          ['样件 / 小批', '样件 8 周（含控制板打样）；小批 12 周'],
        ],
      },
      messages: [
        {
          role: 'eng',
          name: 'AE · 李工 · 10:05',
          text: '可行性结论：Feasible，基型 CAHB-22-D2E。三个定制点都做过类似项目；唯一悬念是 6,000 N 静态载荷，需要按曲线校核。',
        },
      ],
      bullets: [
        { level: 'ok', text: '1 / 2 / 3.1~3.5 / 4 全部章节经销售确认、AE 复核' },
        { level: 'ok', text: '3 处客户询问已答复并回填报表' },
        { level: 'warn', text: '静态载荷 6,000 N 待曲线校核，可能触发加强壳体（成本 +8%）' },
        { level: 'risk', text: '出口管制需合规初筛，未过筛前不承诺批量交期' },
      ],
    },
    {
      no: '10',
      time: '10:08',
      title: '三方对齐确认单 · 系统归档',
      owner: '客户 + 销售 + AE',
      confirm: {
        title: '三方对齐确认单（客户 / 销售 / AE）',
        hint: '系统把三方口径融合到同一张表：每一节都能追到客户原话与谁确认、何时确认；确认后冻结为需求基线。',
        rows: [
          {
            field: '1 Project introduction',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: 'iCRM-2026-0451 · EAU 50 pcs · 样件 8 周',
          },
          {
            field: '2 Application information',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: '越野机器人转向控制 · 每班 400 次',
          },
          {
            field: '3.1 Performance',
            customer: '✓ 补充 6,000 N',
            sales: '✓',
            ae: '✓',
            note: '48 V / 3,500 N / 37 mm/s / 20%',
          },
          {
            field: '3.2 Functions',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: 'CANopen · 绝对位置反馈 · 自锁',
          },
          {
            field: '3.3 Installation interface',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: '行程 50 · M12 4 芯 · 1.5 m',
          },
          {
            field: '3.4 Tests',
            customer: '✓ 确认温度口径',
            sales: '✓',
            ae: '✓',
            note: '平台标准 -40/+85 ℃ · IP66M/69K · 60 万次',
          },
          {
            field: '3.5 Certification',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: 'CE · UL 不做',
          },
          {
            field: '4 Other',
            customer: '✓',
            sales: '✓',
            ae: '✓',
            note: '出口管制初筛 · 木箱 10 件/箱 · 2 件备件',
          },
          {
            field: '5 Feasibility',
            customer: '—',
            sales: '✓',
            ae: '✓',
            note: 'Feasible · 基型 CAHB-22-D2E',
          },
        ],
        parties: [
          { role: '客户', name: '王工', status: '已确认', time: '10:06' },
          { role: '销售', name: '陈工', status: '已确认', time: '10:07' },
          { role: 'AE', name: '李工', status: '已确认', time: '10:08' },
        ],
        stamp: '三方已对齐 · 系统归档 10:08',
      },
      handoff: [
        { label: 'iCRM', value: 'iCRM-2026-0451' },
        { label: '报表', value: '500413 R03 · 销售确认 + AE 复核 + 三方签署' },
        { label: '基型', value: 'CAHB-22-D2E（EW000970459）' },
        { label: '下一站', value: '02 产品目录检索 · 图纸与 BOM' },
      ],
      messages: [
        {
          role: 'bot',
          name: '需求系统 · 10:08',
          text: '三方确认完成：客户确认 3 处补充（含 6,000 N）、销售确认全部报表、AE 完成复核并给出可行性结论。需求基线冻结为 REQ-20261021-001（R03），流转到第 02 区。',
        },
        {
          role: 'sales',
          name: '销售 · 陈工 · 10:08',
          text: '收到，我把三方确认单转给客户存档。',
        },
      ],
    },
  ],
}
