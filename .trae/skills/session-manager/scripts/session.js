#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 获取当前目录路径
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 配置项
const CONFIG = {
  todoFilePath: path.join(process.cwd(), 'tasks', 'todo.md'),
  sessionDir: path.join(__dirname, '..', 'sessions'),
  defaultParticipants: [],
  defaultType: 'meeting'
};

// 确保会话目录存在
if (!fs.existsSync(CONFIG.sessionDir)) {
  fs.mkdirSync(CONFIG.sessionDir, { recursive: true });
}

// 命令行参数解析
const args = process.argv.slice(2);
const command = args[0];

// 当前会话状态
let currentSession = null;
const sessionStateFile = path.join(CONFIG.sessionDir, 'current-session.json');

// 加载当前会话
function loadCurrentSession() {
  if (fs.existsSync(sessionStateFile)) {
    try {
      currentSession = JSON.parse(fs.readFileSync(sessionStateFile, 'utf8'));
    } catch (error) {
      console.error('Error loading current session:', error.message);
      currentSession = null;
    }
  }
}

// 保存当前会话
function saveCurrentSession() {
  if (currentSession) {
    fs.writeFileSync(sessionStateFile, JSON.stringify(currentSession, null, 2));
  }
}

// 清除当前会话
function clearCurrentSession() {
  if (fs.existsSync(sessionStateFile)) {
    fs.unlinkSync(sessionStateFile);
  }
  currentSession = null;
}

// 生成会话 ID
function generateSessionId() {
  const date = new Date().toISOString().split('T')[0];
  const sessions = fs.readdirSync(CONFIG.sessionDir).filter(file => file.startsWith(date));
  return `${date}-${sessions.length + 1}`;
}

// 开始新会话
function startSession(options) {
  const sessionId = generateSessionId();
  currentSession = {
    id: sessionId,
    title: options.title || '未命名会话',
    participants: options.participants ? options.participants.split(',').map(p => p.trim()) : CONFIG.defaultParticipants,
    type: options.type || CONFIG.defaultType,
    startTime: new Date().toISOString(),
    content: [],
    actions: [],
    references: []
  };
  
  saveCurrentSession();
  console.log(`会话已开始: ${currentSession.title} (ID: ${sessionId})`);
}

// 添加会话内容
function addContent(options) {
  loadCurrentSession();
  
  if (!currentSession) {
    console.error('没有活跃的会话，请先开始一个会话');
    return;
  }
  
  if (options.content) {
    currentSession.content.push(options.content);
    console.log('已添加核心内容');
  }
  
  if (options.action) {
    currentSession.actions.push({
      description: options.action,
      assignee: options.assignee || '未分配',
      deadline: options.deadline || '未设置'
    });
    console.log('已添加行动项');
  }
  
  if (options.reference) {
    currentSession.references.push({
      description: options.reference,
      url: options.url || ''
    });
    console.log('已添加参考资料');
  }
  
  saveCurrentSession();
}

// 结束会话并保存
function endSession(options) {
  loadCurrentSession();
  
  if (!currentSession) {
    console.error('没有活跃的会话');
    return;
  }
  
  currentSession.endTime = new Date().toISOString();
  
  if (options.save) {
    saveToTodoMd(currentSession);
    console.log('会话已保存到 todo.md');
  } else if (options.preview) {
    previewSession(currentSession);
  }
  
  // 保存会话到单独的文件
  const sessionFile = path.join(CONFIG.sessionDir, `${currentSession.id}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(currentSession, null, 2));
  
  clearCurrentSession();
  console.log('会话已结束');
}

// 将会话保存到 todo.md
function saveToTodoMd(session) {
  if (!fs.existsSync(CONFIG.todoFilePath)) {
    console.error('todo.md 文件不存在');
    return;
  }
  
  const content = fs.readFileSync(CONFIG.todoFilePath, 'utf8');
  const date = new Date(session.startTime).toISOString().split('T')[0];
  
  // 构建会话记录
  let sessionRecord = `\n#### [${date}] ${session.title}\n\n`;
  sessionRecord += `**参与者**: ${session.participants.join(', ')}\n`;
  
  const startTime = new Date(session.startTime).toLocaleTimeString();
  const endTime = new Date(session.endTime).toLocaleTimeString();
  sessionRecord += `**时间**: ${startTime} - ${endTime}\n`;
  sessionRecord += `**类型**: #${session.type}\n\n`;
  
  sessionRecord += `**核心内容**:\n`;
  session.content.forEach(item => {
    sessionRecord += `- ${item}\n`;
  });
  
  sessionRecord += `\n**行动项**:\n`;
  session.actions.forEach(action => {
    sessionRecord += `- [ ] ${action.description} - ${action.assignee} - ${action.deadline}\n`;
  });
  
  sessionRecord += `\n**参考资料**:\n`;
  session.references.forEach(ref => {
    sessionRecord += `- [${ref.description}${ref.url ? `: ${ref.url}` : ''}]\n`;
  });
  
  // 找到会话记录部分并追加
  const sessionLogsMarker = '## 会话记录 (Session Logs)';
  const sessionTemplateMarker = '### 会话记录模板';
  
  if (content.includes(sessionLogsMarker)) {
    if (content.includes(sessionTemplateMarker)) {
      // 在模板之前插入
      const updatedContent = content.replace(sessionTemplateMarker, sessionRecord + '\n### 会话记录模板');
      fs.writeFileSync(CONFIG.todoFilePath, updatedContent);
    } else {
      // 在会话记录部分末尾追加
      const updatedContent = content + sessionRecord;
      fs.writeFileSync(CONFIG.todoFilePath, updatedContent);
    }
  } else {
    // 如果没有会话记录部分，添加一个
    const updatedContent = content + `\n---\n\n## 会话记录 (Session Logs)\n\n${sessionRecord}`;
    fs.writeFileSync(CONFIG.todoFilePath, updatedContent);
  }
}

// 预览会话内容
function previewSession(session) {
  console.log('\n=== 会话预览 ===');
  console.log(`标题: ${session.title}`);
  console.log(`参与者: ${session.participants.join(', ')}`);
  console.log(`类型: ${session.type}`);
  console.log(`时间: ${new Date(session.startTime).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}`);
  
  console.log('\n核心内容:');
  session.content.forEach((item, index) => {
    console.log(`${index + 1}. ${item}`);
  });
  
  console.log('\n行动项:');
  session.actions.forEach((action, index) => {
    console.log(`${index + 1}. ${action.description} - ${action.assignee} - ${action.deadline}`);
  });
  
  console.log('\n参考资料:');
  session.references.forEach((ref, index) => {
    console.log(`${index + 1}. ${ref.description}${ref.url ? `: ${ref.url}` : ''}`);
  });
  console.log('=== 预览结束 ===\n');
}

// 列出所有会话
function listSessions() {
  const sessions = fs.readdirSync(CONFIG.sessionDir)
    .filter(file => file.endsWith('.json') && !file.includes('current-session'))
    .map(file => {
      const session = JSON.parse(fs.readFileSync(path.join(CONFIG.sessionDir, file), 'utf8'));
      return {
        id: session.id,
        title: session.title,
        date: new Date(session.startTime).toISOString().split('T')[0],
        type: session.type
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  console.log('\n=== 会话列表 ===');
  sessions.forEach(session => {
    console.log(`${session.id} - ${session.title} (${session.type}) - ${session.date}`);
  });
  console.log('=== 列表结束 ===\n');
}

// 搜索会话
function searchSessions(keyword) {
  const sessions = fs.readdirSync(CONFIG.sessionDir)
    .filter(file => file.endsWith('.json') && !file.includes('current-session'))
    .map(file => JSON.parse(fs.readFileSync(path.join(CONFIG.sessionDir, file), 'utf8')))
    .filter(session => {
      return session.title.includes(keyword) || 
             session.content.some(item => item.includes(keyword)) ||
             session.actions.some(action => action.description.includes(keyword));
    });
  
  console.log(`\n=== 搜索结果 (关键词: ${keyword}) ===`);
  sessions.forEach(session => {
    console.log(`${session.id} - ${session.title} (${session.type})`);
    console.log(`  日期: ${new Date(session.startTime).toISOString().split('T')[0]}`);
    console.log(`  核心内容: ${session.content.slice(0, 2).join('; ')}${session.content.length > 2 ? '...' : ''}`);
    console.log('');
  });
  console.log('=== 搜索结束 ===\n');
}

// 查看特定会话详情
function viewSession(sessionId) {
  const sessionFile = path.join(CONFIG.sessionDir, `${sessionId}.json`);
  
  if (!fs.existsSync(sessionFile)) {
    console.error(`会话 ${sessionId} 不存在`);
    return;
  }
  
  const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
  previewSession(session);
}

// 辅助函数：获取命令行参数值
function getArgValue(args, flag) {
  const arg = args.find(arg => arg.startsWith(flag));
  return arg ? arg.split('=')[1] : undefined;
}

// 命令处理
switch (command) {
  case 'start':
    const startOptions = {
      title: getArgValue(args, '--title=') || '未命名会话',
      participants: getArgValue(args, '--participants='),
      type: getArgValue(args, '--type=')
    };
    startSession(startOptions);
    break;
  
  case 'add':
    const addOptions = {
      content: getArgValue(args, '--content='),
      action: getArgValue(args, '--action='),
      assignee: getArgValue(args, '--assignee='),
      deadline: getArgValue(args, '--deadline='),
      reference: getArgValue(args, '--reference='),
      url: getArgValue(args, '--url=')
    };
    addContent(addOptions);
    break;
  
  case 'end':
    const endOptions = {
      save: args.includes('--save'),
      preview: args.includes('--preview')
    };
    endSession(endOptions);
    break;
  
  case 'list':
    listSessions();
    break;
  
  case 'search':
    const keyword = getArgValue(args, '--keyword=');
    if (keyword) {
      searchSessions(keyword);
    } else {
      console.error('请提供搜索关键词');
    }
    break;
  
  case 'view':
    const sessionId = getArgValue(args, '--id=');
    if (sessionId) {
      viewSession(sessionId);
    } else {
      console.error('请提供会话 ID');
    }
    break;
  
  default:
    console.log('用法: session-manager <命令> [选项]');
    console.log('');
    console.log('命令:');
    console.log('  start    开始新会话');
    console.log('  add      添加会话内容');
    console.log('  end      结束会话并保存');
    console.log('  list     列出所有会话');
    console.log('  search   搜索会话');
    console.log('  view     查看会话详情');
    console.log('');
    console.log('示例:');
    console.log('  session-manager start --title "项目规划会议" --type meeting');
    console.log('  session-manager add --content "讨论了技术架构"');
    console.log('  session-manager end --save');
    break;
}
