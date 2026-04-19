/**
 * 首页交互逻辑测试用例
 * Homepage Interaction Test Suite
 *
 * 覆盖：正常输入 / 空输入 / 边界输入 / 错误场景
 * 工具：@testing-library/react + @testing-library/user-event v13 + jest
 *
 * 不修改任何生产代码。
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  // Mock window.alert — jsdom 不实现弹窗
  jest.spyOn(window, "alert").mockImplementation(() => {});
  // 每个用例前清空 localStorage，确保隔离
  localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 渲染整个应用 */
function renderApp() {
  return render(<App />);
}

/** 获取任务输入框 */
function getInput() {
  return screen.getByRole("textbox", { name: /what needs to be done/i });
}

/** 获取 Add 提交按钮 */
function getAddButton() {
  return screen.getByRole("button", { name: /^add$/i });
}

/**
 * 通过 UI 添加一个任务（使用 fireEvent.change 避免逐字符慢速输入）
 * 适用于需要精确控制 value 的场景（如超长字符串）
 */
function addTaskViaFireEvent(name) {
  fireEvent.change(getInput(), { target: { value: name } });
  userEvent.click(getAddButton());
}

// ─── 1. 正常输入场景 (Normal Input) ──────────────────────────────────────────

describe("正常输入场景 (Normal Input)", () => {
  /**
   * TC-NI-01: 提交有效任务名称 — 任务出现在列表中
   *
   * 前置条件: 应用已渲染，任务列表为空
   * 步骤:
   *   1. 在输入框中输入 "Buy groceries"
   *   2. 点击 Add 按钮
   * 断言: 列表中显示 "Buy groceries"
   */
  test("TC-NI-01: 提交有效任务名称 — 任务出现在列表中", () => {
    renderApp();

    userEvent.type(getInput(), "Buy groceries");
    userEvent.click(getAddButton());

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  /**
   * TC-NI-02: 成功提交后输入框被清空
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入 "Read a book"
   *   2. 点击 Add
   * 断言: 输入框 value 变为空字符串
   */
  test("TC-NI-02: 成功提交后输入框被清空", () => {
    renderApp();

    userEvent.type(getInput(), "Read a book");
    userEvent.click(getAddButton());

    expect(getInput()).toHaveValue("");
  });

  /**
   * TC-NI-03: 添加任务后计数标题更新（单数）
   *
   * 前置条件: 应用已渲染，初始显示 "0 tasks remaining"
   * 步骤:
   *   1. 添加一个任务
   * 断言: 标题更新为 "1 task remaining"（注意单数形式）
   */
  test("TC-NI-03: 添加一个任务后标题显示单数 '1 task remaining'", () => {
    renderApp();

    expect(screen.getByText("0 tasks remaining")).toBeInTheDocument();

    userEvent.type(getInput(), "Write tests");
    userEvent.click(getAddButton());

    expect(screen.getByText("1 task remaining")).toBeInTheDocument();
  });

  /**
   * TC-NI-04: 连续添加多个任务 — 所有任务均显示
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 依次添加 "Task A"、"Task B"、"Task C"
   * 断言: 三个任务均显示；计数为 "3 tasks remaining"
   */
  test("TC-NI-04: 连续添加多个任务 — 所有任务均显示", () => {
    renderApp();

    ["Task A", "Task B", "Task C"].forEach((name) => {
      userEvent.type(getInput(), name);
      userEvent.click(getAddButton());
    });

    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
    expect(screen.getByText("Task C")).toBeInTheDocument();
    expect(screen.getByText("3 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-NI-05: 新建任务的默认优先级为 Medium
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 添加任务 "Default priority task"
   * 断言: 任务优先级标签显示 "Priority: Medium"
   */
  test("TC-NI-05: 新建任务的默认优先级为 Medium", () => {
    renderApp();

    userEvent.type(getInput(), "Default priority task");
    userEvent.click(getAddButton());

    expect(screen.getByText(/priority: medium/i)).toBeInTheDocument();
  });
});

// ─── 2. 空输入场景 (Empty Input) ─────────────────────────────────────────────

describe("空输入场景 (Empty Input)", () => {
  /**
   * TC-EI-01: 提交空输入 — 弹出 alert，不添加任务
   *
   * 前置条件: 应用已渲染，输入框为空
   * 步骤:
   *   1. 不输入任何内容，直接点击 Add
   * 断言:
   *   - window.alert 以 "Task cannot be empty!" 被调用
   *   - 任务列表仍为空（计数保持 "0 tasks remaining"）
   */
  test("TC-EI-01: 提交空输入 — 弹出 alert，不添加任务", () => {
    renderApp();

    userEvent.click(getAddButton());

    expect(window.alert).toHaveBeenCalledWith("Task cannot be empty!");
    expect(screen.getByText("0 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-EI-02: 提交纯空格输入 — 弹出 alert，不添加任务
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入 "   "（三个空格）
   *   2. 点击 Add
   * 断言:
   *   - window.alert 被触发
   *   - 列表仍为空
   */
  test("TC-EI-02: 提交纯空格输入 — 弹出 alert，不添加任务", () => {
    renderApp();

    fireEvent.change(getInput(), { target: { value: "   " } });
    userEvent.click(getAddButton());

    expect(window.alert).toHaveBeenCalledWith("Task cannot be empty!");
    expect(screen.getByText("0 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-EI-03: 提交空输入失败后输入框保留用户内容
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 在输入框输入 "   "
   *   2. 提交（失败）
   * 断言: 输入框 value 仍为 "   "（未被清空）
   */
  test("TC-EI-03: 提交失败后输入框保留用户内容", () => {
    renderApp();

    fireEvent.change(getInput(), { target: { value: "   " } });
    userEvent.click(getAddButton());

    expect(getInput()).toHaveValue("   ");
  });
});

// ─── 3. 边界输入场景 (Boundary Input) ────────────────────────────────────────

describe("边界输入场景 (Boundary Input)", () => {
  /**
   * TC-BI-01: 提交单字符任务名称 — 任务被添加
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入单个字符 "A"，提交
   * 断言: 任务 "A" 出现在列表中
   */
  test("TC-BI-01: 单字符任务名称被成功添加", () => {
    renderApp();

    userEvent.type(getInput(), "A");
    userEvent.click(getAddButton());

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  /**
   * TC-BI-02: 提交超长任务名称（200 字符）— 任务被添加
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 生成 200 个 "a" 字符的字符串，通过 fireEvent.change 填入输入框
   *   2. 点击 Add
   * 断言: 任务出现在列表中，计数变为 1
   */
  test("TC-BI-02: 200 字符超长任务名称被成功添加", () => {
    renderApp();

    const longName = "a".repeat(200);
    addTaskViaFireEvent(longName);

    expect(screen.getByText(longName)).toBeInTheDocument();
    expect(screen.getByText("1 task remaining")).toBeInTheDocument();
  });

  /**
   * TC-BI-03: 提交含 HTML 特殊字符的任务名称 — 任务安全渲染
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入 'Task & <b>bold</b> "quotes"'，提交
   * 断言: 任务名称以文本形式（非 HTML 注入）显示在列表中
   */
  test("TC-BI-03: 含 HTML 特殊字符的任务名称安全渲染", () => {
    renderApp();

    const specialName = 'Task & <b>bold</b> "quotes"';
    addTaskViaFireEvent(specialName);

    expect(screen.getByText(specialName)).toBeInTheDocument();
    // 确保没有被当作 HTML 解析（<b> 元素不应存在于 todo label 中）
    expect(screen.queryByRole("strong")).not.toBeInTheDocument();
  });

  /**
   * TC-BI-04: 提交含 emoji 的任务名称 — 任务被添加
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入 "Buy 🍎 apples"，提交
   * 断言: 任务出现在列表中
   */
  test("TC-BI-04: 含 emoji 的任务名称被成功添加", () => {
    renderApp();

    addTaskViaFireEvent("Buy 🍎 apples");

    expect(screen.getByText("Buy 🍎 apples")).toBeInTheDocument();
  });

  /**
   * TC-BI-05: 连续添加两个同名任务 — 两个任务均存在
   *
   * 前置条件: 应用已渲染
   * 步骤:
   *   1. 输入 "Duplicate task"，提交
   *   2. 再次输入 "Duplicate task"，提交
   * 断言:
   *   - 列表中有两个 "Duplicate task" 文本节点
   *   - 计数为 "2 tasks remaining"
   */
  test("TC-BI-05: 两个同名任务均被独立添加", () => {
    renderApp();

    addTaskViaFireEvent("Duplicate task");
    addTaskViaFireEvent("Duplicate task");

    expect(screen.getAllByText("Duplicate task")).toHaveLength(2);
    expect(screen.getByText("2 tasks remaining")).toBeInTheDocument();
  });
});

// ─── 4. 任务完成状态切换 (Toggle Completion) ─────────────────────────────────

describe("任务完成状态切换 (Toggle Completion)", () => {
  /**
   * TC-TC-01: 勾选复选框 — 任务标记为已完成
   *
   * 前置条件: 存在一个未完成的任务
   * 步骤:
   *   1. 点击该任务的复选框
   * 断言: 复选框变为选中状态
   */
  test("TC-TC-01: 勾选复选框将任务标记为已完成", () => {
    renderApp();
    addTaskViaFireEvent("Do laundry");

    const checkbox = screen.getByRole("checkbox");
    userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  /**
   * TC-TC-02: 已完成任务在 Active 筛选下不显示
   *
   * 前置条件: 存在一个已完成的任务
   * 步骤:
   *   1. 点击 Active 筛选按钮
   * 断言: 已完成任务从列表消失
   */
  test("TC-TC-02: 已完成任务在 Active 筛选下不显示", () => {
    renderApp();
    addTaskViaFireEvent("Done task");
    userEvent.click(screen.getByRole("checkbox"));

    userEvent.click(screen.getByRole("button", { name: /show active tasks/i }));

    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
  });

  /**
   * TC-TC-03: 已完成任务在 Completed 筛选下显示
   *
   * 前置条件: 存在一个已完成的任务
   * 步骤:
   *   1. 点击 Completed 筛选按钮
   * 断言: 已完成任务显示在列表中
   */
  test("TC-TC-03: 已完成任务在 Completed 筛选下显示", () => {
    renderApp();
    addTaskViaFireEvent("Done task");
    userEvent.click(screen.getByRole("checkbox"));

    userEvent.click(screen.getByRole("button", { name: /show completed tasks/i }));

    expect(screen.getByText("Done task")).toBeInTheDocument();
  });
});

// ─── 5. 任务删除场景 (Delete Task) ───────────────────────────────────────────

describe("任务删除场景 (Delete Task)", () => {
  /**
   * TC-D-01: 删除任务 — 任务从列表中移除
   *
   * 前置条件: 存在一个任务 "Clean house"
   * 步骤:
   *   1. 点击该任务的 Delete 按钮
   * 断言: "Clean house" 不再显示
   */
  test("TC-D-01: 删除任务后任务从列表中消失", () => {
    renderApp();
    addTaskViaFireEvent("Clean house");

    userEvent.click(screen.getByRole("button", { name: /delete clean house/i }));

    expect(screen.queryByText("Clean house")).not.toBeInTheDocument();
  });

  /**
   * TC-D-02: 删除唯一任务后列表为空
   *
   * 前置条件: 只有一个任务
   * 步骤:
   *   1. 删除该任务
   * 断言: 计数显示 "0 tasks remaining"
   */
  test("TC-D-02: 删除唯一任务后计数归零", () => {
    renderApp();
    addTaskViaFireEvent("Only task");

    userEvent.click(screen.getByRole("button", { name: /delete only task/i }));

    expect(screen.getByText("0 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-D-03: 删除其中一个任务 — 其余任务保留
   *
   * 前置条件: 存在 "Task 1" 和 "Task 2" 两个任务
   * 步骤:
   *   1. 删除 "Task 1"
   * 断言:
   *   - "Task 1" 不显示
   *   - "Task 2" 仍显示
   *   - 计数为 "1 task remaining"
   */
  test("TC-D-03: 删除一个任务不影响其他任务", () => {
    renderApp();
    addTaskViaFireEvent("Task 1");
    addTaskViaFireEvent("Task 2");

    userEvent.click(screen.getByRole("button", { name: /delete task 1/i }));

    expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
    expect(screen.getByText("1 task remaining")).toBeInTheDocument();
  });
});

// ─── 6. 任务编辑场景 (Edit Task) ─────────────────────────────────────────────

describe("任务编辑场景 (Edit Task)", () => {
  /**
   * TC-E-01: 点击 Edit 按钮 — 进入编辑模式
   *
   * 前置条件: 存在任务 "Old name"
   * 步骤:
   *   1. 点击 Edit 按钮
   * 断言: 出现带有 "New name for Old name" 标签的文本输入框
   */
  test("TC-E-01: 点击 Edit 进入编辑模式", () => {
    renderApp();
    addTaskViaFireEvent("Old name");

    userEvent.click(screen.getByRole("button", { name: /edit old name/i }));

    expect(
      screen.getByRole("textbox", { name: /new name for old name/i })
    ).toBeInTheDocument();
  });

  /**
   * TC-E-02: 修改任务名称并保存 — 任务名称更新
   *
   * 前置条件: 存在任务 "Old name"，已进入编辑模式
   * 步骤:
   *   1. 清空编辑框，输入 "New name"
   *   2. 点击 Save
   * 断言:
   *   - 列表显示 "New name"
   *   - "Old name" 不再显示
   */
  test("TC-E-02: 修改任务名称并保存后名称更新", () => {
    renderApp();
    addTaskViaFireEvent("Old name");
    userEvent.click(screen.getByRole("button", { name: /edit old name/i }));

    const editInput = screen.getByRole("textbox", { name: /new name for old name/i });
    userEvent.clear(editInput);
    userEvent.type(editInput, "New name");
    userEvent.click(screen.getByRole("button", { name: /save new name for old name/i }));

    expect(screen.getByText("New name")).toBeInTheDocument();
    expect(screen.queryByText("Old name")).not.toBeInTheDocument();
  });

  /**
   * TC-E-03: 修改任务优先级并保存 — 优先级更新
   *
   * 前置条件: 存在默认 Medium 优先级任务 "Important task"
   * 步骤:
   *   1. 点击 Edit，将优先级改为 "High"，点击 Save
   * 断言: 优先级标签显示 "Priority: High"
   */
  test("TC-E-03: 修改任务优先级并保存后优先级更新", () => {
    renderApp();
    addTaskViaFireEvent("Important task");
    userEvent.click(screen.getByRole("button", { name: /edit important task/i }));

    userEvent.selectOptions(
      screen.getByRole("combobox", { name: /priority for important task/i }),
      "High"
    );
    userEvent.click(
      screen.getByRole("button", { name: /save new name for important task/i })
    );

    expect(screen.getByText(/priority: high/i)).toBeInTheDocument();
  });

  /**
   * TC-E-04: 点击 Cancel — 返回查看模式，内容不变
   *
   * 前置条件: 存在任务 "Original"，已进入编辑模式
   * 步骤:
   *   1. 将名称改为 "Changed"
   *   2. 点击 Cancel
   * 断言:
   *   - 任务名称仍为 "Original"
   *   - "Changed" 不显示
   */
  test("TC-E-04: 点击 Cancel 退出编辑不保存更改", () => {
    renderApp();
    addTaskViaFireEvent("Original");
    userEvent.click(screen.getByRole("button", { name: /edit original/i }));

    const editInput = screen.getByRole("textbox", { name: /new name for original/i });
    userEvent.clear(editInput);
    userEvent.type(editInput, "Changed");
    userEvent.click(
      screen.getByRole("button", { name: /cancel renaming original/i })
    );

    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.queryByText("Changed")).not.toBeInTheDocument();
  });

  /**
   * TC-E-05 (错误场景): 保存空名称 — 不更新，留在编辑模式
   *
   * 前置条件: 存在任务 "Valid task"，已进入编辑模式
   * 步骤:
   *   1. 清空编辑框
   *   2. 点击 Save
   * 断言: 编辑输入框仍可见（未退出编辑模式），任务名称未更新
   */
  test("TC-E-05 (错误): 保存空名称时不退出编辑模式", () => {
    renderApp();
    addTaskViaFireEvent("Valid task");
    userEvent.click(screen.getByRole("button", { name: /edit valid task/i }));

    const editInput = screen.getByRole("textbox", { name: /new name for valid task/i });
    userEvent.clear(editInput);
    userEvent.click(
      screen.getByRole("button", { name: /save new name for valid task/i })
    );

    // 仍在编辑模式（输入框仍可见）
    expect(
      screen.getByRole("textbox", { name: /new name for valid task/i })
    ).toBeInTheDocument();
  });

  /**
   * TC-E-06 (错误场景): 保存纯空格名称 — 不更新，留在编辑模式
   *
   * 前置条件: 存在任务 "Valid task"，已进入编辑模式
   * 步骤:
   *   1. 将名称改为 "   "（纯空格）
   *   2. 点击 Save
   * 断言: 编辑输入框仍可见（Todo.handleSubmit 中的 trim 校验阻止保存）
   */
  test("TC-E-06 (错误): 保存纯空格名称时不退出编辑模式", () => {
    renderApp();
    addTaskViaFireEvent("Valid task");
    userEvent.click(screen.getByRole("button", { name: /edit valid task/i }));

    const editInput = screen.getByRole("textbox", { name: /new name for valid task/i });
    fireEvent.change(editInput, { target: { value: "   " } });
    userEvent.click(
      screen.getByRole("button", { name: /save new name for valid task/i })
    );

    expect(
      screen.getByRole("textbox", { name: /new name for valid task/i })
    ).toBeInTheDocument();
  });
});

// ─── 7. 筛选按钮场景 (Filter Buttons) ────────────────────────────────────────

describe("筛选按钮场景 (Filter Buttons)", () => {
  /**
   * TC-FB-01: 初始状态下 All 筛选处于激活（aria-pressed=true）
   *
   * 前置条件: 应用初始渲染
   * 断言:
   *   - All 按钮 aria-pressed="true"
   *   - Active / Completed 按钮 aria-pressed="false"
   */
  test("TC-FB-01: 初始状态 All 筛选处于激活状态", () => {
    renderApp();

    expect(
      screen.getByRole("button", { name: /show all tasks/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /show active tasks/i })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: /show completed tasks/i })
    ).toHaveAttribute("aria-pressed", "false");
  });

  /**
   * TC-FB-02: 点击 Active 筛选 — 只显示未完成任务
   *
   * 前置条件: 存在已完成任务 "Done task" 和未完成任务 "Active task"
   * 步骤:
   *   1. 点击 Active 筛选按钮
   * 断言:
   *   - "Active task" 显示
   *   - "Done task" 不显示
   */
  test("TC-FB-02: Active 筛选只显示未完成任务", () => {
    renderApp();
    addTaskViaFireEvent("Active task");
    addTaskViaFireEvent("Done task");
    // 完成第二个任务
    userEvent.click(screen.getAllByRole("checkbox")[1]);

    userEvent.click(screen.getByRole("button", { name: /show active tasks/i }));

    expect(screen.getByText("Active task")).toBeInTheDocument();
    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
  });

  /**
   * TC-FB-03: 点击 Completed 筛选 — 只显示已完成任务
   *
   * 前置条件: 同上（一已完成，一未完成）
   * 步骤:
   *   1. 点击 Completed 筛选按钮
   * 断言:
   *   - "Done task" 显示
   *   - "Active task" 不显示
   */
  test("TC-FB-03: Completed 筛选只显示已完成任务", () => {
    renderApp();
    addTaskViaFireEvent("Active task");
    addTaskViaFireEvent("Done task");
    userEvent.click(screen.getAllByRole("checkbox")[1]);

    userEvent.click(screen.getByRole("button", { name: /show completed tasks/i }));

    expect(screen.queryByText("Active task")).not.toBeInTheDocument();
    expect(screen.getByText("Done task")).toBeInTheDocument();
  });

  /**
   * TC-FB-04: 从 Active 切换回 All — 所有任务重新显示
   *
   * 前置条件: 两个任务，一已完成；当前筛选为 Active
   * 步骤:
   *   1. 点击 All 筛选按钮
   * 断言: 两个任务均显示
   */
  test("TC-FB-04: 从 Active 切换回 All 后所有任务重新显示", () => {
    renderApp();
    addTaskViaFireEvent("Task 1");
    addTaskViaFireEvent("Task 2");
    userEvent.click(screen.getAllByRole("checkbox")[0]);
    userEvent.click(screen.getByRole("button", { name: /show active tasks/i }));

    userEvent.click(screen.getByRole("button", { name: /show all tasks/i }));

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  /**
   * TC-FB-05: 切换筛选后活跃按钮的 aria-pressed 更新
   *
   * 前置条件: 应用已渲染，默认 All 激活
   * 步骤:
   *   1. 点击 Active 筛选按钮
   * 断言:
   *   - Active 按钮 aria-pressed="true"
   *   - All 按钮 aria-pressed="false"
   */
  test("TC-FB-05: 切换筛选后 aria-pressed 状态正确更新", () => {
    renderApp();

    userEvent.click(screen.getByRole("button", { name: /show active tasks/i }));

    expect(
      screen.getByRole("button", { name: /show active tasks/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: /show all tasks/i })
    ).toHaveAttribute("aria-pressed", "false");
  });
});

// ─── 8. 任务计数标题 (Task Count Heading) ────────────────────────────────────

describe("任务计数标题 (Task Count Heading)", () => {
  /**
   * TC-H-01: 无任务时显示 "0 tasks remaining"
   *
   * 前置条件: localStorage 为空，应用初始渲染
   * 断言: 标题文本为 "0 tasks remaining"
   */
  test("TC-H-01: 无任务时显示 '0 tasks remaining'", () => {
    renderApp();

    expect(screen.getByText("0 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-H-02: 一个任务时使用单数 "1 task remaining"
   *
   * 前置条件: 添加一个任务
   * 断言: 标题文本为 "1 task remaining"（无 s）
   */
  test("TC-H-02: 一个任务时标题使用单数形式", () => {
    renderApp();
    addTaskViaFireEvent("Single task");

    expect(screen.getByText("1 task remaining")).toBeInTheDocument();
  });

  /**
   * TC-H-03: 多个任务时使用复数 "X tasks remaining"
   *
   * 前置条件: 添加两个任务
   * 断言: 标题文本为 "2 tasks remaining"
   */
  test("TC-H-03: 多个任务时标题使用复数形式", () => {
    renderApp();
    addTaskViaFireEvent("Task 1");
    addTaskViaFireEvent("Task 2");

    expect(screen.getByText("2 tasks remaining")).toBeInTheDocument();
  });

  /**
   * TC-H-04: 计数反映当前筛选结果（不是总数）
   *
   * 前置条件: 两个任务，一已完成，切换到 Active 筛选
   * 步骤:
   *   1. 点击 Active 筛选按钮
   * 断言: 标题显示 "1 task remaining"（只计 Active 任务）
   */
  test("TC-H-04: 计数反映当前筛选结果而非总数", () => {
    renderApp();
    addTaskViaFireEvent("Active task");
    addTaskViaFireEvent("Done task");
    userEvent.click(screen.getAllByRole("checkbox")[1]);

    userEvent.click(screen.getByRole("button", { name: /show active tasks/i }));

    expect(screen.getByText("1 task remaining")).toBeInTheDocument();
  });
});

// ─── 9. LocalStorage 持久化场景 ──────────────────────────────────────────────

describe("LocalStorage 持久化场景", () => {
  /**
   * TC-LS-01: 添加任务后数据写入 localStorage
   *
   * 前置条件: 应用已渲染，localStorage 为空
   * 步骤:
   *   1. 添加任务 "Persisted task"
   * 断言:
   *   - localStorage["tasks"] 解析后包含 1 条记录
   *   - 记录的 name 为 "Persisted task"，completed 为 false，priority 为 "Medium"
   */
  test("TC-LS-01: 添加任务后数据写入 localStorage", () => {
    renderApp();
    addTaskViaFireEvent("Persisted task");

    const stored = JSON.parse(localStorage.getItem("tasks"));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Persisted task");
    expect(stored[0].completed).toBe(false);
    expect(stored[0].priority).toBe("Medium");
  });

  /**
   * TC-LS-02: 应用加载时从 localStorage 恢复任务
   *
   * 前置条件: localStorage 中预存一个任务（priority: High）
   * 步骤:
   *   1. 渲染应用
   * 断言:
   *   - 任务名称显示在列表中
   *   - 优先级显示为 "Priority: High"
   */
  test("TC-LS-02: 应用加载时从 localStorage 恢复已有任务", () => {
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        { id: "todo-preset", name: "Pre-loaded task", completed: false, priority: "High" },
      ])
    );

    renderApp();

    expect(screen.getByText("Pre-loaded task")).toBeInTheDocument();
    expect(screen.getByText(/priority: high/i)).toBeInTheDocument();
  });

  /**
   * TC-LS-03: 删除任务后 localStorage 更新
   *
   * 前置条件: 存在 "Keep this" 和 "Delete this" 两个任务
   * 步骤:
   *   1. 删除 "Delete this"
   * 断言: localStorage 中只剩一条记录，name 为 "Keep this"
   */
  test("TC-LS-03: 删除任务后 localStorage 同步更新", () => {
    renderApp();
    addTaskViaFireEvent("Keep this");
    addTaskViaFireEvent("Delete this");

    userEvent.click(screen.getByRole("button", { name: /delete delete this/i }));

    const stored = JSON.parse(localStorage.getItem("tasks"));
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe("Keep this");
  });

  /**
   * TC-LS-04: 切换任务完成状态后 localStorage 更新
   *
   * 前置条件: 存在一个未完成任务
   * 步骤:
   *   1. 勾选复选框
   * 断言: localStorage 中该任务的 completed 变为 true
   */
  test("TC-LS-04: 切换完成状态后 localStorage 同步更新", () => {
    renderApp();
    addTaskViaFireEvent("Toggle me");

    userEvent.click(screen.getByRole("checkbox"));

    const stored = JSON.parse(localStorage.getItem("tasks"));
    expect(stored[0].completed).toBe(true);
  });
});
