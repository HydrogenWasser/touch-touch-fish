"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// ==================== 美式夸张喜剧风文案 ====================
const SLAPSTICK_MESSAGES = [
    "🎹 砰！一块 100 吨的铁砧即将砸在你的颈椎上。立刻起立伸展！",
    "🔥 你的键盘快冒烟了！快去喝水，不然老板就要拿平底锅敲你的头了！",
    "🚜 警告：检测到你的脑细胞正在被像压路机一样碾碎，立刻停止敲击键盘，去摸鱼！",
    "⚡ 你的屁股已经和椅子融为一体了！再不站起来，你就要变成办公椅侠了！",
    "🥤 你的水杯在哭泣！它已经孤单了45分钟，快去给它一个温暖的拥抱！",
    "👀 你的眼睛正在发出红色警报！它们说：再看屏幕就要变成二维码了！",
    "🦒 你的脖子已经僵成了长颈鹿！快活动一下，不然明天就要去动物园报到了！",
    "☕ 咖啡机都在抗议了：这家伙怎么还不来续杯？快去安抚它！",
    "🐱 汤姆猫已经扛着大锤在你身后了！快跑！去茶水间躲躲！",
    "⏰ 时间到！你的摸鱼许可证已生效，请立即前往窗户边发呆5分钟！",
    "🧘 你的身体正在发送SOS信号：主人，我快要变成石头了！快起来拉伸！",
    "🌊 你的膀胱正在经历海啸级别的压力测试！请立即执行紧急疏散程序！",
    "🎪 马戏团的空中飞人都在休息了，你还在卷什么？快起来活动！",
    "🍕 你的胃正在播放《空城计》，去吃点东西吧，别让身体开演唱会！",
    "🎬 导演喊咔了！这场45分钟的敬业戏码到此结束，CUT！去休息！"
];
// ==================== 摸鱼计时器类 ====================
class TouchFishTimer {
    constructor() {
        this.remainingSeconds = 0;
        this.workIntervalMinutes = 45;
        this.isRunning = false;
        this.snoozeTimeMinutes = 5;
        // 创建状态栏项，放在左侧
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'touchTouchFish.toggleTimer';
        this.statusBarItem.show();
        // 加载配置
        this.loadConfiguration();
        // 监听配置变化
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('touchTouchFish')) {
                this.loadConfiguration();
                // 如果配置改变了工作时长且计时器未运行，重置计时器
                if (!this.isRunning) {
                    this.resetTimer();
                }
            }
        });
        // 初始化显示
        this.resetTimer();
    }
    /**
     * 从 VSCode 配置加载设置
     */
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('touchTouchFish');
        this.workIntervalMinutes = config.get('workInterval', 45);
        this.snoozeTimeMinutes = config.get('snoozeTime', 5);
    }
    /**
     * 更新状态栏显示
     */
    updateStatusBar() {
        const minutes = Math.floor(this.remainingSeconds / 60);
        const seconds = this.remainingSeconds % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (this.isRunning) {
            this.statusBarItem.text = `🐟 ${timeStr}`;
            this.statusBarItem.tooltip = '摸鱼倒计时进行中...\n点击暂停';
        }
        else {
            this.statusBarItem.text = `⏸️ 🐟 ${timeStr}`;
            this.statusBarItem.tooltip = '摸鱼计时器已暂停\n点击开始';
        }
    }
    /**
     * 切换计时器状态（开始/暂停）
     */
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        }
        else {
            this.startTimer();
        }
    }
    /**
     * 开始计时
     */
    startTimer() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.updateStatusBar();
        this.timerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.updateStatusBar();
            if (this.remainingSeconds <= 0) {
                this.onTimerComplete();
            }
        }, 1000);
    }
    /**
     * 暂停计时
     */
    pauseTimer() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
        }
        this.updateStatusBar();
    }
    /**
     * 重置计时器
     */
    resetTimer() {
        this.pauseTimer();
        this.remainingSeconds = this.workIntervalMinutes * 60;
        this.updateStatusBar();
    }
    /**
     * 贪睡功能 - 延后提醒
     */
    snooze() {
        this.pauseTimer();
        this.remainingSeconds = this.snoozeTimeMinutes * 60;
        this.startTimer();
        vscode.window.showInformationMessage(`⏰ 好的，再给你 ${this.snoozeTimeMinutes} 分钟，时间一到立马去休息！`);
    }
    /**
     * 计时结束处理
     */
    async onTimerComplete() {
        this.pauseTimer();
        // 随机选择一条文案
        const message = SLAPSTICK_MESSAGES[Math.floor(Math.random() * SLAPSTICK_MESSAGES.length)];
        // 显示通知，提供两个按钮选项
        const result = await vscode.window.showInformationMessage(message, { modal: false }, '去摸鱼 (立即重置计时)', '再卷 5 分钟 (Snooze)');
        if (result === '去摸鱼 (立即重置计时)') {
            this.resetTimer();
            this.startTimer();
            vscode.window.showInformationMessage('🎉 明智之选！计时器已重置，下次记得准时休息哦~');
        }
        else if (result === '再卷 5 分钟 (Snooze)') {
            this.snooze();
        }
        else {
            // 用户关闭了提示框，默认重置并开始新的计时
            this.resetTimer();
            this.startTimer();
        }
    }
    /**
     * 释放资源
     */
    dispose() {
        this.pauseTimer();
        this.statusBarItem.dispose();
    }
}
// ==================== 插件激活/停用 ====================
let touchFishTimer;
function activate(context) {
    console.log('🐟 TouchTouchFish 摸鱼小助手已激活！');
    // 创建计时器实例
    touchFishTimer = new TouchFishTimer();
    // 注册命令
    const toggleCommand = vscode.commands.registerCommand('touchTouchFish.toggleTimer', () => {
        touchFishTimer?.toggleTimer();
    });
    const resetCommand = vscode.commands.registerCommand('touchTouchFish.resetTimer', () => {
        touchFishTimer?.resetTimer();
        vscode.window.showInformationMessage('🔄 摸鱼计时器已重置！');
    });
    const settingsCommand = vscode.commands.registerCommand('touchTouchFish.showSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'touchTouchFish');
    });
    // 将所有命令和计时器添加到订阅列表
    context.subscriptions.push(toggleCommand, resetCommand, settingsCommand, touchFishTimer);
    // 启动时自动开始计时
    touchFishTimer.startTimer();
}
function deactivate() {
    console.log('🐟 TouchTouchFish 摸鱼小助手已停用！');
    touchFishTimer?.dispose();
    touchFishTimer = undefined;
}
//# sourceMappingURL=extension.js.map