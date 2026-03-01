#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 配置
const CONFIG = {
  todoFilePath: path.join(process.cwd(), 'tasks', 'todo.md'),
  workStateFile: path.join(__dirname, '..', 'work-state.json'),
  sessionManagerPath: path.join(process.cwd(), '.trae', 'skills', 'session-manager', 'scripts', 'session.js')
};

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 辅助函数：提问
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 辅助函数：显示菜单
function showMenu() {
  console.log('\n🚀 工作流管理器');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('1️⃣  开始新的想法 / 新功能');
  console.log('2️⃣  按照 todo 继续之前的工作');
  console.log('3️⃣  结束当前工作，记录 todo/需求文档');
  console.log('4️⃣  提交发布（提交代码并发布）');
  console.log('5️⃣  查看当前工作状态');
  console.log('0️⃣  退出');
  console.log('');
  console.log('═══════════════════════════════════════\n');
}

// 加载工作状态
function loadWorkState() {
  if (fs.existsSync(CONFIG.workStateFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.workStateFile, 'utf8'));
    } catch (error) {
      return null;
    }
  }
  return null;
}

// 保存工作状态
function saveWorkState(state) {
  fs.writeFileSync(CONFIG.workStateFile, JSON.stringify(state, null, 2));
}

// 清除工作状态
function clearWorkState() {
  if (fs.existsSync(CONFIG.workStateFile)) {
    fs.unlinkSync(CONFIG.workStateFile);
  }
}

// 1. 开始新的想法/新功能
async function startNewWork() {
  console.log('\n🎯 开始新的工作\n');
  
  const workType = await ask('这是什么类型的工作？\n1. 新功能 (feature)\n2. 修复bug (bugfix)\n3. 优化改进 (improvement)\n4. 其他\n请选择 (1-4): ');
  
  const typeMap = {
    '1': 'feature',
    '2': 'bugfix', 
    '3': 'improvement',
    '4': 'other'
  };
  
  const type = typeMap[workType] || 'other';
  const title = await ask('\n📝 工作标题: ');
  const description = await ask('📝 简要描述: ');
  
  console.log('\n📋 是否创建会话记录？');
  const createSession = await ask('创建会话记录? (y/n): ');
  
  let sessionId = null;
  if (createSession.toLowerCase() === 'y') {
    try {
      // 启动会话
      execSync(`node ${CONFIG.sessionManagerPath} start --title="${title}" --type=planning --participants="开发者"`, { stdio: 'inherit' });
      
      // 添加描述到会话
      if (description) {
        execSync(`node ${CONFIG.sessionManagerPath} add --content="${description}"`, { stdio: 'inherit' });
      }
      
      console.log('\n✅ 会话已创建');
    } catch (error) {
      console.log('⚠️  会话创建失败，继续创建工作...');
    }
  }
  
  // 保存工作状态
  const workState = {
    id: Date.now().toString(),
    type,
    title,
    description,
    startTime: new Date().toISOString(),
    status: 'in_progress',
    sessionId
  };
  
  saveWorkState(workState);
  
  console.log('\n✅ 工作状态已保存');
  console.log(`\n🎯 当前工作: ${title}`);
  console.log(`📊 类型: ${type}`);
  console.log(`⏰ 开始时间: ${new Date().toLocaleString()}`);
  console.log('\n💡 提示: 使用 "npm run work" 随时查看或更新工作状态');
}

// 2. 按照 todo 继续工作
async function continueWork() {
  const workState = loadWorkState();
  
  if (!workState) {
    console.log('\n⚠️  没有找到进行中的工作');
    console.log('💡 使用选项 1 开始新的工作');
    return;
  }
  
  console.log('\n📋 当前工作状态\n');
  console.log(`🎯 标题: ${workState.title}`);
  console.log(`📊 类型: ${workState.type}`);
  console.log(`⏰ 开始时间: ${new Date(workState.startTime).toLocaleString()}`);
  console.log(`📝 描述: ${workState.description || '无'}`);
  console.log(`📈 状态: ${workState.status}`);
  
  // 读取 todo.md 中的未完成项
  if (fs.existsSync(CONFIG.todoFilePath)) {
    const todoContent = fs.readFileSync(CONFIG.todoFilePath, 'utf8');
    const todoSection = todoContent.match(/## Phase.*?\n([\s\S]*?)(?=## |$)/);
    
    if (todoSection) {
      console.log('\n📋 当前阶段任务:');
      const lines = todoSection[1].split('\n').filter(line => line.trim().startsWith('- ['));
      lines.slice(0, 10).forEach(line => {
        console.log(`  ${line.trim()}`);
      });
    }
  }
  
  console.log('\n💡 接下来可以:');
  console.log('  1. 继续当前工作');
  console.log('  2. 更新工作进度');
  console.log('  3. 添加新的行动项');
  console.log('  4. 结束当前工作');
  
  const choice = await ask('\n请选择 (1-4): ');
  
  switch (choice) {
    case '2':
      const progress = await ask('\n📝 输入进度更新: ');
      workState.progress = workState.progress || [];
      workState.progress.push({
        time: new Date().toISOString(),
        content: progress
      });
      saveWorkState(workState);
      
      // 添加到会话
      try {
        execSync(`node ${CONFIG.sessionManagerPath} add --content="${progress}"`, { stdio: 'inherit' });
      } catch (error) {
        // 忽略错误
      }
      
      console.log('\n✅ 进度已更新');
      break;
      
    case '3':
      const action = await ask('\n📝 行动项描述: ');
      const assignee = await ask('👤 负责人: ') || '当前用户';
      const deadline = await ask('📅 截止日期: ') || '未设置';
      
      try {
        execSync(`node ${CONFIG.sessionManagerPath} add --action="${action}" --assignee="${assignee}" --deadline="${deadline}"`, { stdio: 'inherit' });
        console.log('\n✅ 行动项已添加');
      } catch (error) {
        console.log('⚠️  添加行动项失败');
      }
      break;
      
    case '4':
      await finishWork();
      break;
      
    default:
      console.log('\n💪 继续加油！使用 "npm run work" 随时更新进度');
  }
}

// 3. 结束当前工作
async function finishWork() {
  const workState = loadWorkState();
  
  if (!workState) {
    console.log('\n⚠️  没有找到进行中的工作');
    return;
  }
  
  console.log('\n🏁 结束当前工作\n');
  console.log(`🎯 标题: ${workState.title}`);
  
  const summary = await ask('\n📝 工作总结: ');
  const completed = await ask('✅ 是否已完成? (y/n): ');
  const needDoc = await ask('📝 是否需要更新文档? (y/n): ');
  
  if (needDoc.toLowerCase() === 'y') {
    const docType = await ask('选择文档类型:\n1. 更新 todo.md\n2. 创建需求文档\n3. 更新架构文档\n请选择 (1-3): ');
    
    switch (docType) {
      case '1':
        console.log('\n📝 请手动更新 tasks/todo.md 文件');
        break;
      case '2':
        const docName = await ask('文档名称: ');
        console.log(`\n📝 请创建 docs/${docName}.md 文件`);
        break;
      case '3':
        console.log('\n📝 请更新 docs/03_architecture_and_cicd.md 文件');
        break;
    }
  }
  
  // 结束会话
  console.log('\n💾 保存会话记录...');
  try {
    execSync(`node ${CONFIG.sessionManagerPath} end --save`, { stdio: 'inherit' });
    console.log('✅ 会话已保存到 todo.md');
  } catch (error) {
    console.log('⚠️  会话保存失败');
  }
  
  // 更新工作状态
  workState.endTime = new Date().toISOString();
  workState.status = completed.toLowerCase() === 'y' ? 'completed' : 'paused';
  workState.summary = summary;
  
  // 保存到历史记录
  const historyFile = path.join(__dirname, '..', 'work-history.json');
  let history = [];
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  history.push(workState);
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  
  // 清除当前工作状态
  clearWorkState();
  
  console.log('\n✅ 工作已结束并保存');
  console.log(`📊 状态: ${workState.status}`);
  console.log(`⏰ 结束时间: ${new Date().toLocaleString()}`);
  
  // 询问是否提交代码
  const shouldCommit = await ask('\n💾 是否提交代码? (y/n): ');
  if (shouldCommit.toLowerCase() === 'y') {
    await commitAndRelease(false);
  }
}

// 4. 提交发布
async function commitAndRelease(shouldRelease = true) {
  console.log('\n💾 提交代码\n');
  
  const workState = loadWorkState();
  const title = workState ? workState.title : '更新';
  const type = workState ? workState.type : 'improvement';
  
  // 生成提交信息
  const commitMessage = await ask(`📝 提交信息 (默认: "${type}: ${title}"): `) || `${type}: ${title}`;
  
  try {
    // 检查是否有变更
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!status.trim()) {
      console.log('\n⚠️  没有要提交的变更');
      return;
    }
    
    console.log('\n📋 变更文件:');
    console.log(status);
    
    const confirm = await ask('确认提交? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ 已取消提交');
      return;
    }
    
    // 执行提交
    console.log('\n🚀 执行提交...');
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('\n✅ 代码已提交');
    
    // 询问是否推送
    const shouldPush = await ask('\n📤 是否推送到远程? (y/n): ');
    if (shouldPush.toLowerCase() === 'y') {
      execSync('git push', { stdio: 'inherit' });
      console.log('✅ 已推送到远程');
    }
    
    // 询问是否发布
    if (shouldRelease) {
      const doRelease = await ask('\n🚀 是否发布新版本? (y/n): ');
      if (doRelease.toLowerCase() === 'y') {
        console.log('\n🚀 开始发布流程...');
        try {
          execSync('npm run release', { stdio: 'inherit' });
          console.log('\n✅ 发布完成！');
        } catch (error) {
          console.log('\n❌ 发布失败，请手动执行发布流程');
        }
      }
    }
    
  } catch (error) {
    console.log('\n❌ 提交失败:', error.message);
  }
}

// 5. 查看当前工作状态
function showWorkStatus() {
  const workState = loadWorkState();
  
  if (!workState) {
    console.log('\n📭 当前没有进行中的工作');
    console.log('💡 使用 "npm run work" 开始新的工作');
    return;
  }
  
  const startTime = new Date(workState.startTime);
  const now = new Date();
  const duration = Math.floor((now - startTime) / 1000 / 60); // 分钟
  
  console.log('\n📊 当前工作状态\n');
  console.log(`🎯 标题: ${workState.title}`);
  console.log(`📊 类型: ${workState.type}`);
  console.log(`📝 描述: ${workState.description || '无'}`);
  console.log(`⏰ 开始时间: ${startTime.toLocaleString()}`);
  console.log(`⏱️  持续时间: ${duration} 分钟`);
  console.log(`📈 状态: ${workState.status}`);
  
  if (workState.progress && workState.progress.length > 0) {
    console.log('\n📋 进度记录:');
    workState.progress.forEach((p, i) => {
      console.log(`  ${i + 1}. [${new Date(p.time).toLocaleTimeString()}] ${p.content}`);
    });
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  // 跳过 npm run work -- 传递的参数，找到实际的命令
  let commandIndex = 0;
  while (commandIndex < args.length && args[commandIndex].startsWith('--')) {
    commandIndex++;
  }
  
  if (commandIndex < args.length) {
    options.command = args[commandIndex];
    
    // 解析命令后面的参数
    for (let i = commandIndex + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
        options[key] = value;
        if (value !== true) i++;
      }
    }
  }
  
  return options;
}

// 非交互式模式
async function nonInteractiveMode(options) {
  switch (options.command) {
    case 'start':
      console.log('\n🎯 开始新的工作\n');
      
      const workState = {
        id: Date.now().toString(),
        type: options.type || 'feature',
        title: options.title || '未命名工作',
        description: options.description || '',
        startTime: new Date().toISOString(),
        status: 'in_progress'
      };
      
      saveWorkState(workState);
      
      console.log('✅ 工作状态已保存');
      console.log(`\n🎯 当前工作: ${workState.title}`);
      console.log(`📊 类型: ${workState.type}`);
      console.log(`⏰ 开始时间: ${new Date().toLocaleString()}`);
      console.log('\n💡 提示: 使用 "npm run work -- status" 查看工作状态');
      break;
      
    case 'finish':
      console.log('\n🏁 结束当前工作\n');
      
      const currentWork = loadWorkState();
      if (!currentWork) {
        console.log('⚠️  没有找到进行中的工作');
        return;
      }
      
      console.log(`🎯 标题: ${currentWork.title}`);
      
      // 更新工作状态
      currentWork.endTime = new Date().toISOString();
      currentWork.status = 'completed';
      currentWork.summary = options.summary || '工作完成';
      
      // 保存到历史记录
      const historyFile = path.join(__dirname, '..', 'work-history.json');
      let history = [];
      if (fs.existsSync(historyFile)) {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      }
      history.push(currentWork);
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
      
      // 清除当前工作状态
      clearWorkState();
      
      console.log('✅ 工作已结束并保存');
      console.log(`📊 状态: ${currentWork.status}`);
      console.log(`⏰ 结束时间: ${new Date().toLocaleString()}`);
      break;
      
    case 'status':
      showWorkStatus();
      break;
      
    case 'continue':
      console.log('\n📋 继续工作\n');
      
      const work = loadWorkState();
      if (!work) {
        console.log('⚠️  没有找到进行中的工作');
        return;
      }
      
      console.log(`🎯 继续工作: ${work.title}`);
      console.log(`📊 类型: ${work.type}`);
      console.log(`⏰ 开始时间: ${new Date(work.startTime).toLocaleString()}`);
      
      if (options.progress) {
        work.progress = work.progress || [];
        work.progress.push({
          time: new Date().toISOString(),
          content: options.progress
        });
        saveWorkState(work);
        console.log('\n✅ 进度已更新');
      }
      break;
      
    case 'commit':
      await commitAndRelease(false);
      break;
      
    case 'release':
      await commitAndRelease(true);
      break;
      
    default:
      console.log('\n❌ 无效的命令');
      console.log('\n可用命令:');
      console.log('  start    开始新工作');
      console.log('  finish   结束当前工作');
      console.log('  status   查看工作状态');
      console.log('  continue 继续工作');
      console.log('  commit   提交代码');
      console.log('  release  提交并发布');
      break;
  }
}

// 主函数
async function main() {
  const options = parseArgs();
  
  if (options.command) {
    // 非交互式模式
    await nonInteractiveMode(options);
  } else {
    // 交互式模式
    const workState = loadWorkState();
    
    // 如果有进行中的工作，先显示状态
    if (workState) {
      const startTime = new Date(workState.startTime);
      const now = new Date();
      const duration = Math.floor((now - startTime) / 1000 / 60);
      
      console.log('\n📌 你有进行中的工作:\n');
      console.log(`🎯 ${workState.title} (${workState.type})`);
      console.log(`⏱️  已进行 ${duration} 分钟`);
      console.log('');
    }
    
    showMenu();
    
    const choice = await ask('请选择操作 (0-5): ');
    
    switch (choice) {
      case '1':
        await startNewWork();
        break;
      case '2':
        await continueWork();
        break;
      case '3':
        await finishWork();
        break;
      case '4':
        await commitAndRelease(true);
        break;
      case '5':
        showWorkStatus();
        break;
      case '0':
        console.log('\n👋 再见！');
        break;
      default:
        console.log('\n❌ 无效的选择');
    }
  }
  
  rl.close();
}

// 运行主函数
main().catch(error => {
  console.error('错误:', error);
  rl.close();
  process.exit(1);
});
