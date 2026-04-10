import * as vscode from 'vscode';

// ==================== 美式夸张喜剧风文案 ====================
const SLAPSTICK_MESSAGES: string[] = [
	"🌊 该喝水了",
];

// ==================== 贪睡惩罚相关文案 ====================
const PUNISH_MESSAGES: string[] = [
	"💀 检测到连续卷王行为，求求你不要再卷了！喝点水吧！"
];

// ==================== 模糊模式颜色配置 ====================
// 预计算的渐暗颜色序列 (Alpha: FF -> 22)
const BLUR_COLOR_STEPS = [
	'#FFFFFFFF', // 100% 可见
	'#FFFFFFDD', // 87% 可见
	'#FFFFFFBB', // 73% 可见
	'#FFFFFF99', // 60% 可见
	'#FFFFFF77', // 47% 可见
	'#FFFFFF55', // 33% 可见
	'#FFFFFF33', // 20% 可见
	'#FFFFFF22', // 13% 可见 (几乎看不见)
];

// ==================== 摸鱼计时器类 ====================
class TouchFishTimer {
	private statusBarItem: vscode.StatusBarItem;
	private timerInterval: NodeJS.Timeout | undefined;
	private remainingSeconds: number = 0;
	private workIntervalMinutes: number = 45;
	private isRunning: boolean = false;
	private snoozeTimeMinutes: number = 5;
	
	// 贪睡追踪
	private snoozeCount: number = 0;
	private isBlurMode: boolean = false;
	private blurAnimationInterval: NodeJS.Timeout | undefined;
	
	// 保存模糊模式前的状态栏命令
	private originalCommand: string = 'touchTouchFish.toggleTimer';

	constructor() {
		// 创建状态栏项，放在左侧
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left,
			100
		);
		this.statusBarItem.command = this.originalCommand;
		this.statusBarItem.show();

		// 加载配置
		this.loadConfiguration();

		// 监听配置变化
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('touchTouchFish')) {
				this.loadConfiguration();
				// 如果配置改变了工作时长且计时器未运行且不在模糊模式，重置计时器
				if (!this.isRunning && !this.isBlurMode) {
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
	private loadConfiguration(): void {
		const config = vscode.workspace.getConfiguration('touchTouchFish');
		this.workIntervalMinutes = config.get<number>('workInterval', 45);
		this.snoozeTimeMinutes = config.get<number>('snoozeTime', 5);
	}

	/**
	 * 更新状态栏显示
	 */
	private updateStatusBar(): void {
		// 模糊模式下显示特殊状态栏
		if (this.isBlurMode) {
			this.statusBarItem.text = '🚨 你的眼睛快瞎了！点击去喝水恢复！';
			this.statusBarItem.tooltip = '⚠️ 连续贪睡惩罚已触发！\n点击恢复视觉并去休息！';
			this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
			return;
		}

		const minutes = Math.floor(this.remainingSeconds / 60);
		const seconds = this.remainingSeconds % 60;
		const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
		
		if (this.isRunning) {
			this.statusBarItem.text = `🐟 ${timeStr}`;
			this.statusBarItem.tooltip = '摸鱼倒计时进行中...\n点击暂停';
		} else {
			this.statusBarItem.text = `⏸️ 🐟 ${timeStr}`;
			this.statusBarItem.tooltip = '摸鱼计时器已暂停\n点击开始';
		}
		this.statusBarItem.backgroundColor = undefined;
	}

	/**
	 * 切换计时器状态（开始/暂停）
	 * 在模糊模式下，此按钮变为"恢复视觉"按钮
	 */
	public toggleTimer(): void {
		if (this.isBlurMode) {
			// 模糊模式下点击状态栏 = 恢复视觉
			this.restoreVision();
			return;
		}

		if (this.isRunning) {
			this.pauseTimer();
		} else {
			this.startTimer();
		}
	}

	/**
	 * 开始计时
	 */
	public startTimer(): void {
		if (this.isRunning || this.isBlurMode) {
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
	public pauseTimer(): void {
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
	public resetTimer(): void {
		this.pauseTimer();
		this.remainingSeconds = this.workIntervalMinutes * 60;
		this.updateStatusBar();
	}

	/**
	 * 贪睡功能 - 延后提醒
	 */
	public snooze(): void {
		this.pauseTimer();
		this.snoozeCount++;
		
		// 检查是否触发惩罚
		if (this.snoozeCount >= 2) {
			this.enterBlurMode();
		} else {
			this.remainingSeconds = this.snoozeTimeMinutes * 60;
			this.startTimer();
			vscode.window.showInformationMessage(`⏰ 好的，再给你 ${this.snoozeTimeMinutes} 分钟，时间一到立马去休息！`);
		}
	}

	/**
	 * 进入模糊模式（连续贪睡惩罚）
	 */
	private async enterBlurMode(): Promise<void> {
		this.isBlurMode = true;
		this.pauseTimer();

		// 显示惩罚警告
		const punishMessage = PUNISH_MESSAGES[Math.floor(Math.random() * PUNISH_MESSAGES.length)];
		vscode.window.showWarningMessage(
			`${punishMessage} 连续贪睡 ${this.snoozeCount} 次！启动视觉致盲模式！`,
			'😱 我错了，现在就去休息！'
		);

		// 更新状态栏为"解药"模式
		this.statusBarItem.command = 'touchTouchFish.restoreVision';
		this.updateStatusBar();

		// 启动渐暗动画
		await this.startBlurAnimation();
	}

	/**
	 * 启动渐暗动画
	 * 分8步，每步375ms，总共3秒
	 */
	private async startBlurAnimation(): Promise<void> {
		const config = vscode.workspace.getConfiguration('editor');
		let step = 0;

		// 清除之前的动画
		if (this.blurAnimationInterval) {
			clearInterval(this.blurAnimationInterval);
		}

		return new Promise((resolve) => {
			this.blurAnimationInterval = setInterval(async () => {
				if (step >= BLUR_COLOR_STEPS.length) {
					if (this.blurAnimationInterval) {
						clearInterval(this.blurAnimationInterval);
						this.blurAnimationInterval = undefined;
					}
					resolve();
					return;
				}

				const color = BLUR_COLOR_STEPS[step];
				
				// 应用颜色配置
				await this.applyBlurColor(color);
				
				step++;
			}, 375); // 375ms × 8 = 3秒
		});
	}

	/**
	 * 应用模糊颜色配置
	 */
	private async applyBlurColor(color: string): Promise<void> {
		const config = vscode.workspace.getConfiguration('editor');
		
		// 构建 tokenColorCustomizations 配置
		const blurCustomization = {
			comments: color,
			strings: color,
			keywords: color,
			variables: color,
			functions: color,
			numbers: color,
			types: color,
			textMateRules: [
				{
					scope: ['comment', 'punctuation.definition.comment'],
					settings: { foreground: color }
				},
				{
					scope: ['string', 'string.quoted', 'string.template'],
					settings: { foreground: color }
				},
				{
					scope: ['keyword', 'storage.type', 'storage.modifier'],
					settings: { foreground: color }
				},
				{
					scope: ['variable', 'variable.other', 'variable.parameter'],
					settings: { foreground: color }
				},
				{
					scope: ['entity.name.function', 'support.function'],
					settings: { foreground: color }
				},
				{
					scope: ['constant.numeric'],
					settings: { foreground: color }
				},
				{
					scope: ['entity.name.type', 'support.type'],
					settings: { foreground: color }
				},
				{
					scope: ['entity.name.class', 'support.class'],
					settings: { foreground: color }
				},
				{
					scope: ['punctuation', 'meta.brace', 'meta.delimiter'],
					settings: { foreground: color }
				}
			]
		};

		// 应用到工作区配置
		await config.update('tokenColorCustomizations', blurCustomization, vscode.ConfigurationTarget.Workspace);
	}

	/**
	 * 恢复视觉（点击解药按钮）
	 */
	public async restoreVision(): Promise<void> {
		if (!this.isBlurMode) {
			return;
		}

		// 停止动画
		if (this.blurAnimationInterval) {
			clearInterval(this.blurAnimationInterval);
			this.blurAnimationInterval = undefined;
		}

		// 恢复编辑器颜色配置
		const config = vscode.workspace.getConfiguration('editor');
		await config.update('tokenColorCustomizations', undefined, vscode.ConfigurationTarget.Workspace);

		// 重置状态
		this.isBlurMode = false;
		this.snoozeCount = 0;

		// 恢复状态栏命令
		this.statusBarItem.command = this.originalCommand;
		this.updateStatusBar();

		// 重置计时器并开始新的45分钟计时
		this.resetTimer();
		this.startTimer();

		// 提示用户
		vscode.window.showInformationMessage('👀 视觉已恢复！下次记得准时休息，不要再卷了！');
	}

	/**
	 * 计时结束处理
	 */
	private async onTimerComplete(): Promise<void> {
		this.pauseTimer();

		// 随机选择一条文案
		const message = SLAPSTICK_MESSAGES[Math.floor(Math.random() * SLAPSTICK_MESSAGES.length)];

		// 显示通知，提供两个按钮选项
		const result = await vscode.window.showInformationMessage(
			message,
			{ modal: false },
			'去摸鱼 (立即重置计时)',
			'再卷 5 分钟 (Snooze)'
		);

		if (result === '去摸鱼 (立即重置计时)') {
			// 用户选择去摸鱼，重置贪睡计数
			this.snoozeCount = 0;
			this.resetTimer();
			this.startTimer();
			vscode.window.showInformationMessage('🎉 明智之选！计时器已重置，下次记得准时休息哦~');
		} else if (result === '再卷 5 分钟 (Snooze)') {
			this.snooze();
		} else {
			// 用户关闭了提示框，默认重置并开始新的计时
			this.snoozeCount = 0;
			this.resetTimer();
			this.startTimer();
		}
	}

	/**
	 * 获取当前贪睡次数（供外部调用）
	 */
	public getSnoozeCount(): number {
		return this.snoozeCount;
	}

	/**
	 * 是否在模糊模式（供外部调用）
	 */
	public isInBlurMode(): boolean {
		return this.isBlurMode;
	}

	/**
	 * 释放资源
	 */
	public dispose(): void {
		this.pauseTimer();
		if (this.blurAnimationInterval) {
			clearInterval(this.blurAnimationInterval);
		}
		this.statusBarItem.dispose();
	}
}

// ==================== 插件激活/停用 ====================
let touchFishTimer: TouchFishTimer | undefined;

export function activate(context: vscode.ExtensionContext): void {
	console.log('🐟 TouchTouchFish 摸鱼小助手已激活！');

	// 创建计时器实例
	touchFishTimer = new TouchFishTimer();

	// 注册命令
	const toggleCommand = vscode.commands.registerCommand(
		'touchTouchFish.toggleTimer',
		() => {
			touchFishTimer?.toggleTimer();
		}
	);

	const resetCommand = vscode.commands.registerCommand(
		'touchTouchFish.resetTimer',
		() => {
			touchFishTimer?.resetTimer();
			vscode.window.showInformationMessage('🔄 摸鱼计时器已重置！');
		}
	);

	const settingsCommand = vscode.commands.registerCommand(
		'touchTouchFish.showSettings',
		() => {
			vscode.commands.executeCommand(
				'workbench.action.openSettings',
				'touchTouchFish'
			);
		}
	);

	// 新增：恢复视觉命令
	const restoreVisionCommand = vscode.commands.registerCommand(
		'touchTouchFish.restoreVision',
		() => {
			touchFishTimer?.restoreVision();
		}
	);

	// 将所有命令和计时器添加到订阅列表
	context.subscriptions.push(
		toggleCommand,
		resetCommand,
		settingsCommand,
		restoreVisionCommand,
		touchFishTimer!
	);

	// 启动时自动开始计时
	touchFishTimer.startTimer();
}

export function deactivate(): void {
	console.log('🐟 TouchTouchFish 摸鱼小助手已停用！');
	
	// 插件停用时恢复编辑器配置（如果在模糊模式）
	if (touchFishTimer?.isInBlurMode()) {
		const config = vscode.workspace.getConfiguration('editor');
		config.update('tokenColorCustomizations', undefined, vscode.ConfigurationTarget.Workspace);
	}
	
	touchFishTimer?.dispose();
	touchFishTimer = undefined;
}
