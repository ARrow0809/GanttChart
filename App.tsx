

import React, { useState, useEffect, useRef } from 'react';
import { Button as ButtonPrimitive } from './src/components/ui/button.jsx';
import { Input as InputPrimitive } from './src/components/ui/input.jsx';
import { 
  Card as CardPrimitive, 
  CardContent as CardContentPrimitive, 
  CardHeader as CardHeaderPrimitive, 
  CardTitle as CardTitlePrimitive,
  CardDescription as CardDescriptionPrimitive,
  CardFooter as CardFooterPrimitive
} from './src/components/ui/card.jsx';
import { Plus, Download, Upload, Trash2, Edit, Save, FileSpreadsheet, Calendar, Clock, Flag, CheckCircle2, Lock } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, isValid, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import './App.css';

// セル内のテキスト編集用コンポーネント
interface CellEditorProps {
  initialText: string;
  onTextChange: (text: string) => void;
}

// セルの色変更用コンポーネント
interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

// 定義済みの色
const predefinedColors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A8', 
  '#33FFF5', '#FFD133', '#8C33FF', '#FF8C33',
  '#4CAF50', '#2196F3', '#F44336', '#9C27B0',
  '#607D8B', '#795548', '#FF9800', '#CDDC39'
];

const ColorPicker: React.FC<ColorPickerProps> = ({ currentColor, onColorChange }) => {
  const [showPalette, setShowPalette] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // パレットの表示/非表示を切り替え
  const togglePalette = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPalette(!showPalette);
  };

  // 色を選択
  const selectColor = (color: string) => {
    onColorChange(color);
    setShowPalette(false);
  };

  // カスタム色を選択
  const selectCustomColor = () => {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = currentColor;
    input.style.position = 'absolute';
    input.style.visibility = 'hidden';
    
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      onColorChange(target.value);
      setShowPalette(false);
      document.body.removeChild(input);
    });
    
    document.body.appendChild(input);
    input.click();
  };

  // クリックイベントのハンドリング
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowPalette(false);
      }
    };

    if (showPalette) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPalette]);

  return (
    <div className="absolute top-0 right-0 p-1 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity" style={{ zIndex: 25 }}>
      <div 
        ref={buttonRef}
        className="w-4 h-4 rounded-full border border-white/50 cursor-pointer bg-white/20 flex items-center justify-center"
        onClick={togglePalette}
      >
        <span className="text-white text-xs">🎨</span>
      </div>
      
      {showPalette && (
        <div 
          ref={paletteRef}
          className="absolute top-full right-0 mt-1 p-1 bg-white/90 rounded shadow-lg flex flex-wrap gap-1 z-30"
          style={{ width: '100px' }}
        >
          {predefinedColors.map((color, index) => (
            <div
              key={`color-${index}`}
              className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
              onClick={() => selectColor(color)}
            />
          ))}
          <div
            className="w-5 h-5 rounded-full cursor-pointer border border-gray-300 flex items-center justify-center text-xs hover:bg-gray-100"
            title="カスタム色を選択"
            onClick={selectCustomColor}
          >
            +
          </div>
        </div>
      )}
    </div>
  );
};

const CellEditor: React.FC<CellEditorProps> = ({ initialText, onTextChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);

  // 編集モードの切り替え
  const startEditing = () => {
    setIsEditing(true);
    // 次のレンダリングサイクルでフォーカスを設定
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // 編集完了時の処理
  const finishEditing = () => {
    setIsEditing(false);
    onTextChange(text);
  };

  // キー入力のハンドリング
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      setText(initialText); // 元の値に戻す
      setIsEditing(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center cursor-text" onClick={!isEditing ? startEditing : undefined}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent text-xs text-center focus:outline-none focus:bg-white/10 text-white font-medium px-1 py-0.5"
          style={{ zIndex: 25 }}
          autoFocus
        />
      ) : (
        <>
          {text ? (
            <span className="text-xs text-white font-medium truncate">
              {text}
            </span>
          ) : (
            <span className="text-xs text-white/30 font-medium">
              +
            </span>
          )}
        </>
      )}
    </div>
  );
};

// Type definitions for UI components
const Button = ButtonPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'button'> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg';
  }
>;

const Input = InputPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'input'>
>;

const Card = CardPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'div'>
>;
const CardHeader = CardHeaderPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'div'>
>;
const CardTitle = CardTitlePrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'h3'>
>;
const CardDescription = CardDescriptionPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'p'>
>;
const CardContent = CardContentPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'div'>
>;
const CardFooter = CardFooterPrimitive as React.ForwardRefExoticComponent<
  React.ComponentPropsWithRef<'div'>
>;


// Task interface
interface Task {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  firstProofDate: string;
  finalProofDate: string;
  color: string;
  cellTexts: {
    [key: string]: string;  // key format: "taskId-yyyy-MM-dd"
  };
  cellColors: {
    [key: string]: string;  // key format: "taskId-yyyy-MM-dd"
  };
}

// ローカルストレージのキー
const STORAGE_KEY = 'gantt-chart-tasks';
const HISTORY_STORAGE_KEY = 'gantt-chart-tasks-history';

// デフォルトタスクデータ
const defaultTasks: Task[] = [
  {
    id: 'task-1',
    name: '企画書作成',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    firstProofDate: '2025-07-03',
    finalProofDate: '2025-07-05',
    color: '#FF5733',
    cellTexts: {
      'task-1-2025-07-01': '企画',
      'task-1-2025-07-02': '作成',
      'task-1-2025-07-03': '初校',
      'task-1-2025-07-04': 'レビュー',
      'task-1-2025-07-05': '完了'
    },
    cellColors: {
      'task-1-2025-07-01': '#FF5733',
      'task-1-2025-07-02': '#FF7033',
      'task-1-2025-07-03': '#FF8533',
      'task-1-2025-07-04': '#FFA033',
      'task-1-2025-07-05': '#FFB533'
    }
  },
  {
    id: 'task-2',
    name: 'デザイン作成',
    startDate: '2025-07-06',
    endDate: '2025-07-15',
    firstProofDate: '',
    finalProofDate: '',
    color: '#33FF57',
    cellTexts: {
      'task-2-2025-07-06': 'ラフ',
      'task-2-2025-07-07': 'デザイン',
      'task-2-2025-07-08': 'デザイン',
      'task-2-2025-07-09': 'レビュー',
      'task-2-2025-07-10': '修正',
      'task-2-2025-07-11': '修正',
      'task-2-2025-07-12': '最終確認',
      'task-2-2025-07-13': '最終確認',
      'task-2-2025-07-14': '完了',
      'task-2-2025-07-15': '納品'
    },
    cellColors: {}
  }
];

// NewTask type (Task without id)
type NewTask = Omit<Task, 'id'>;

// パスワード認証コンポーネント
interface PasswordAuthProps {
  onAuthenticated: () => void;
}

const PASSWORD = 'gantt'; // パスワードを設定

const PasswordAuth: React.FC<PasswordAuthProps> = ({ onAuthenticated }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // ログイン処理
  const handleLogin = () => {
    if (input === PASSWORD) {
      // パスワードが正しい場合、認証状態を設定
      localStorage.setItem('gantt_authed', '1');
      onAuthenticated();
    } else {
      setError('パスワードが違います');
    }
  };

  // キー入力のハンドリング
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" /> ガントチャート アクセス認証
          </CardTitle>
          <CardDescription className="text-center">
            このガントチャートツールにアクセスするにはパスワードが必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            ) : null}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="パスワードを入力してください"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full"
            >
              ログイン
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  // 認証状態
  const [authenticated, setAuthenticated] = useState(false);
  
  // 認証状態の確認
  useEffect(() => {
    if (localStorage.getItem('gantt_authed')) {
      setAuthenticated(true);
    }
  }, []);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [completedTask, setCompletedTask] = useState<{taskId: string, taskName: string, date: string} | null>(null);
  const [newTask, setNewTask] = useState<NewTask>({
    name: '',
    startDate: '',
    endDate: '',
    firstProofDate: '',
    finalProofDate: '',
    color: '#3B82F6',
    cellTexts: {},
    cellColors: {}
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    // 履歴データのインデックスを取得
    const historyIndex = localStorage.getItem(`${HISTORY_STORAGE_KEY}-index`);
    if (historyIndex) {
      try {
        const historyList: {timestamp: string, key: string}[] = JSON.parse(historyIndex);
        if (historyList.length > 0) {
          // 1ヶ月前の日付
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          // 1ヶ月以内の最新の履歴を取得
          const recentHistory = historyList
            .filter(item => new Date(item.timestamp) >= oneMonthAgo)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          if (recentHistory) {
            const historyData = localStorage.getItem(recentHistory.key);
            if (historyData) {
              const parsedTasks = JSON.parse(historyData) as Task[];
              if (Array.isArray(parsedTasks) && parsedTasks.every(task => task.id && task.name && task.startDate && task.endDate)) {
                setTasks(parsedTasks);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse history data:', error);
      }
    }

    // 履歴がなければ通常の保存データを読み込む
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks) as Task[];
        if (Array.isArray(parsedTasks) && parsedTasks.every(task => task.id && task.name && task.startDate && task.endDate)) {
          setTasks(parsedTasks);
        } else {
          console.error('Saved tasks are not in the correct format.');
          setTasks(defaultTasks);
        }
      } catch (error) {
        console.error('Failed to parse saved tasks:', error);
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, []);

  // タスクが変更されたときにローカルストレージに保存し、履歴も保存
  useEffect(() => {
    if (tasks.length > 0) {
      // 現在のデータを保存
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      
      // 履歴データを保存
      const now = new Date();
      const timestamp = now.toISOString();
      const historyKey = `${HISTORY_STORAGE_KEY}-${timestamp}`;
      
      // 履歴データを取得
      let historyIndex = localStorage.getItem(`${HISTORY_STORAGE_KEY}-index`);
      let historyList: {timestamp: string, key: string}[] = [];
      
      if (historyIndex) {
        try {
          historyList = JSON.parse(historyIndex);
        } catch (e) {
          console.error('履歴インデックスの解析に失敗しました:', e);
          historyList = [];
        }
      }
      
      // 新しい履歴を追加
      historyList.push({timestamp, key: historyKey});
      
      // 1ヶ月以上前の履歴を削除
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const filteredHistory = historyList.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (itemDate > oneMonthAgo) {
          return true;
        } else {
          // 古い履歴データを削除
          localStorage.removeItem(item.key);
          return false;
        }
      });
      
      // 履歴データを保存
      localStorage.setItem(historyKey, JSON.stringify(tasks));
      localStorage.setItem(`${HISTORY_STORAGE_KEY}-index`, JSON.stringify(filteredHistory));
    } else if (tasks.length === 0 && localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [tasks]);

  const exportToExcel = () => {
    // 完全な再現性を確保するための拡張データ構造
    const exportData = tasks.map((task, index) => {
      // 完全なタスクデータをJSON形式で保存（元のIDを含む）
      const taskDataJson = JSON.stringify({
        id: task.id,
        name: task.name,
        startDate: task.startDate,
        endDate: task.endDate,
        firstProofDate: task.firstProofDate || '',
        finalProofDate: task.finalProofDate || '',
        color: task.color,
        cellTexts: task.cellTexts || {},
        cellColors: task.cellColors || {}
      });
      
      // セルテキストデータをJSON文字列に変換（旧形式との互換性のため）
      const cellTextsObj: {[key: string]: string} = {};
      const cellColorsObj: {[key: string]: string} = {};
      
      // taskId-yyyy-MM-dd 形式のキーからyyyy-MM-dd形式のキーに変換
      if (task.cellTexts) {
        Object.entries(task.cellTexts).forEach(([key, value]) => {
          const parts = key.split('-');
          if (parts.length >= 4) {
            // taskId-yyyy-MM-dd から yyyy-MM-dd を抽出
            const datePart = `${parts[parts.length-3]}-${parts[parts.length-2]}-${parts[parts.length-1]}`;
            cellTextsObj[datePart] = value;
          }
        });
      }
      
      // セルカラーデータも同様に処理
      if (task.cellColors) {
        Object.entries(task.cellColors).forEach(([key, value]) => {
          const parts = key.split('-');
          if (parts.length >= 4) {
            const datePart = `${parts[parts.length-3]}-${parts[parts.length-2]}-${parts[parts.length-1]}`;
            cellColorsObj[datePart] = value;
          }
        });
      }
      
      // JSON文字列に変換
      const cellTextsJson = Object.keys(cellTextsObj).length > 0 ? JSON.stringify(cellTextsObj) : '';
      const cellColorsJson = Object.keys(cellColorsObj).length > 0 ? JSON.stringify(cellColorsObj) : '';
      
      // 基本情報は通常の列として表示
      return {
        'No.': index + 1,
        'タスク名': task.name,
        '開始日': task.startDate,
        '終了日': task.endDate,
        '初校日': task.firstProofDate || '',
        '校了日': task.finalProofDate || '',
        '色': task.color,
        // 旧形式との互換性のために残す
        'セルデータ': cellTextsJson,
        'セルカラー': cellColorsJson,
        // 完全なタスクデータを保存（100%再現性のため）
        'タスク完全データ': taskDataJson
      };
    });

    // ガントチャート全体の状態も保存（日付範囲などの情報を含む）
    const metaData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      totalTasks: tasks.length,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      },
      // 完全なタスクデータのバックアップ（シート破損時の復元用）
      allTasksBackup: JSON.stringify(tasks)
    };

    // メタデータをワークシートに追加
    const metaSheet = XLSX.utils.json_to_sheet([{
      'メタデータ': JSON.stringify(metaData)
    }]);

    // 列幅の設定
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const maxWidth = 50; // 最大列幅
    
    // 列幅の設定
    worksheet['!cols'] = [
      { width: 5 },  // No.
      { width: 20 }, // タスク名
      { width: 12 }, // 開始日
      { width: 12 }, // 終了日
      { width: 12 }, // 初校日
      { width: 12 }, // 校了日
      { width: 10 }, // 色
      { width: 30 }, // セルデータ
      { width: 30 }, // セルカラー
      { width: maxWidth } // タスク完全データ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ガントチャート');
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'メタデータ');

    const now = new Date();
    const fileName = `ガントチャート_${format(now, 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  const importFromExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          alert('ファイルの読み込みに失敗しました。');
          return;
        }
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // メインシートからデータを読み込み
        const mainSheetName = workbook.SheetNames[0];
        const mainWorksheet = workbook.Sheets[mainSheetName];
        const jsonData = XLSX.utils.sheet_to_json<any>(mainWorksheet);

        let importedTasks: Task[] = [];
        let importMethod = '';
        
        // 新しい形式（完全データ）のインポート処理
        const tasksWithCompleteData = jsonData.filter(row => row['タスク完全データ']);
        
        if (tasksWithCompleteData.length > 0) {
          // 新形式のデータが見つかった場合
          importMethod = '完全データ形式';
          console.log('完全データ形式でインポートを試みます...');
          
          const validTasks: Task[] = [];
          const errors: string[] = [];
          
          tasksWithCompleteData.forEach((row, index) => {
            try {
              // 完全なタスクデータをJSONから復元
              const taskData = JSON.parse(row['タスク完全データ']);
              
              // 必須フィールドの検証
              if (!taskData.id || !taskData.name || !taskData.startDate || !taskData.endDate) {
                throw new Error(`タスク #${index + 1}: 必須フィールドが不足しています`);
              }
              
              // 日付の検証
              if (!isValid(parseISO(taskData.startDate)) || !isValid(parseISO(taskData.endDate))) {
                throw new Error(`タスク #${index + 1}: 無効な日付形式です`);
              }
              
              validTasks.push({
                id: taskData.id,
                name: taskData.name,
                startDate: taskData.startDate,
                endDate: taskData.endDate,
                firstProofDate: taskData.firstProofDate || '',
                finalProofDate: taskData.finalProofDate || '',
                color: taskData.color || '#3B82F6',
                cellTexts: taskData.cellTexts || {},
                cellColors: taskData.cellColors || {}
              });
            } catch (error) {
              if (error instanceof Error) {
                errors.push(error.message);
              } else {
                errors.push(`タスク #${index + 1}: 不明なエラー`);
              }
              console.error('タスクデータの解析に失敗しました:', error);
            }
          });
          
          if (errors.length > 0) {
            console.warn('インポート中に問題が発生しました:', errors);
            if (validTasks.length > 0) {
              const proceed = window.confirm(
                `${errors.length}件のタスクでエラーが発生しましたが、${validTasks.length}件のタスクは正常に読み込めました。\n` +
                `続行しますか？\n\n` +
                `エラー内容:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...他 ${errors.length - 5} 件` : ''}`
              );
              
              if (proceed) {
                importedTasks = validTasks;
              } else {
                return;
              }
            } else {
              alert(
                `すべてのタスクの読み込みに失敗しました。\n\n` +
                `エラー内容:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...他 ${errors.length - 5} 件` : ''}`
              );
              return;
            }
          } else {
            importedTasks = validTasks;
          }
        } else {
          // メタデータシートからのバックアップ復元を試みる
          try {
            if (workbook.SheetNames.includes('メタデータ')) {
              const metaSheet = workbook.Sheets['メタデータ'];
              const metaData = XLSX.utils.sheet_to_json<any>(metaSheet);
              
              if (metaData.length > 0 && metaData[0]['メタデータ']) {
                const metaInfo = JSON.parse(metaData[0]['メタデータ']);
                
                if (metaInfo.allTasksBackup) {
                  const backupTasks = JSON.parse(metaInfo.allTasksBackup) as Task[];
                  
                  if (Array.isArray(backupTasks) && backupTasks.length > 0 && 
                      backupTasks.every(task => task.id && task.name && task.startDate && task.endDate)) {
                    
                    const useBackup = window.confirm(
                      `メインシートからの読み込みに失敗しましたが、メタデータのバックアップから${backupTasks.length}件のタスクを復元できます。\n` +
                      `バックアップから復元しますか？`
                    );
                    
                    if (useBackup) {
                      importMethod = 'バックアップデータ';
                      importedTasks = backupTasks;
                      console.log('バックアップデータから復元しました。');
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.warn('バックアップデータの復元に失敗しました:', error);
          }
          
          // バックアップからの復元に失敗した場合は旧形式で試行
          if (importedTasks.length === 0) {
            importMethod = '旧形式';
            console.log('旧形式でインポートを試みます...');
            
            // 旧形式のデータ（後方互換性のため）
            importedTasks = jsonData.map((row, index) => {
              const taskId = `imported-task-${Date.now()}-${index}`;
              const cellTexts: {[key: string]: string} = {};
              const cellColors: {[key: string]: string} = {};
              const taskColor = String(row['色'] || row['Color'] || row['color'] || '#3B82F6');
              
              // セルテキストデータの処理
              try {
                const cellDataStr = row['セルデータ'] || row['Cell Data'] || row['cellData'];
                if (cellDataStr && typeof cellDataStr === 'string') {
                  const cellData = JSON.parse(cellDataStr);
                  
                  // 日付ごとのセルテキストを復元
                  if (cellData && typeof cellData === 'object') {
                    Object.entries(cellData).forEach(([datePart, text]) => {
                      if (datePart && text) {
                        // taskId-yyyy-MM-dd 形式のキーを作成
                        const cellKey = `${taskId}-${datePart}`;
                        cellTexts[cellKey] = String(text);
                      }
                    });
                  }
                }
              } catch (error) {
                console.warn(`タスク #${index + 1} のセルテキストデータの解析に失敗しました:`, error);
              }
              
              // セルカラーデータの処理
              try {
                const cellColorStr = row['セルカラー'] || row['Cell Color'] || row['cellColor'];
                if (cellColorStr && typeof cellColorStr === 'string') {
                  const cellColorData = JSON.parse(cellColorStr);
                  
                  // 日付ごとのセルカラーを復元
                  if (cellColorData && typeof cellColorData === 'object') {
                    Object.entries(cellColorData).forEach(([datePart, color]) => {
                      if (datePart && color) {
                        // taskId-yyyy-MM-dd 形式のキーを作成
                        const cellKey = `${taskId}-${datePart}`;
                        cellColors[cellKey] = String(color);
                      }
                    });
                  }
                }
              } catch (error) {
                console.warn(`タスク #${index + 1} のセルカラーデータの解析に失敗しました:`, error);
              }
              
              return {
                id: taskId,
                name: String(row['タスク名'] || row['Task Name'] || row['name'] || `タスク${index + 1}`),
                startDate: formatDateForInput(row['開始日'] || row['Start Date'] || row['startDate']),
                endDate: formatDateForInput(row['終了日'] || row['End Date'] || row['endDate']),
                firstProofDate: formatDateForInput(row['初校日'] || row['First Proof'] || row['firstProofDate']) || '',
                finalProofDate: formatDateForInput(row['校了日'] || row['Final Proof'] || row['finalProofDate']) || '',
                color: taskColor,
                cellTexts: cellTexts,
                cellColors: cellColors
              };
            }).filter(task => task.name && task.startDate && task.endDate && isValid(parseISO(task.startDate)) && isValid(parseISO(task.endDate))) as Task[];
          }
        }

        if (importedTasks.length > 0) {
          if (window.confirm(`${importMethod}で${importedTasks.length}件のタスクをインポートしますか？現在のデータは上書きされます。`)) {
            setTasks(importedTasks);
            console.log(`${importMethod}で${importedTasks.length}件のタスクをインポートしました。`);
          }
        } else {
          alert('有効なタスクデータが見つかりませんでした。ファイル形式を確認してください。');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('ファイルの読み込みに失敗しました。Excelファイル形式を確認してください。');
      }
    };
    reader.readAsArrayBuffer(file);
    
    if(event.target) event.target.value = '';
  };

  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return '';
    
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      try {
        if(isValid(parseISO(dateValue))) return dateValue;
      } catch {}
    }
    
    if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const dateObj = new Date(excelEpoch.getTime() + (dateValue - (dateValue > 60 ? 1: 0) ) * 24 * 60 * 60 * 1000);
        if (isValid(dateObj)) {
            return format(dateObj, 'yyyy-MM-dd');
        }
    }
    
    try {
      const dateObj = parseISO(String(dateValue)); 
      if (isValid(dateObj)) {
        return format(dateObj, 'yyyy-MM-dd');
      }
    } catch (error) {
        try {
            const dateObj = new Date(String(dateValue));
            if (isValid(dateObj)) {
            return format(dateObj, 'yyyy-MM-dd');
            }
        } catch (innerError) {
            console.warn('Date parsing failed for input:', dateValue, innerError);
        }
    }
    
    console.warn('Could not format date:', dateValue);
    return '';
  };

  const clearData = () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
      localStorage.removeItem(STORAGE_KEY);
      setTasks([]);
    }
  };
  
  // 履歴データを取得する関数
  const getHistoryData = () => {
    const historyIndex = localStorage.getItem(`${HISTORY_STORAGE_KEY}-index`);
    if (!historyIndex) {
      alert('履歴データがありません。');
      return;
    }
    
    try {
      const historyList: {timestamp: string, key: string}[] = JSON.parse(historyIndex);
      
      if (historyList.length === 0) {
        alert('履歴データがありません。');
        return;
      }
      
      // 日付でソート（新しい順）
      historyList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 履歴データを選択するためのダイアログを表示
      const selectedIndex = window.prompt(
        `復元する履歴データを選択してください（0～${historyList.length - 1}）:\n` +
        historyList.map((item, index) => 
          `${index}: ${new Date(item.timestamp).toLocaleString('ja-JP')}`
        ).join('\n')
      );
      
      if (selectedIndex === null) return;
      
      const index = parseInt(selectedIndex);
      if (isNaN(index) || index < 0 || index >= historyList.length) {
        alert('無効な選択です。');
        return;
      }
      
      const selectedHistory = historyList[index];
      const historyData = localStorage.getItem(selectedHistory.key);
      
      if (!historyData) {
        alert('選択された履歴データが見つかりませんでした。');
        return;
      }
      
      if (window.confirm(`${new Date(selectedHistory.timestamp).toLocaleString('ja-JP')}のデータを復元しますか？現在のデータは上書きされます。`)) {
        const parsedData = JSON.parse(historyData) as Task[];
        setTasks(parsedData);
      }
    } catch (e) {
      console.error('履歴データの取得に失敗しました:', e);
      alert('履歴データの取得に失敗しました。');
    }
  };


  const getDateRange = () => {
    if (tasks.length === 0) {
      const todayAnchor = new Date();
      return {
        start: startOfMonth(todayAnchor),
        end: endOfMonth(todayAnchor)
      };
    }

    const allValidDates = tasks.flatMap(task => {
      const dates: Date[] = [];
      if (task.startDate) {
        const d = parseISO(task.startDate);
        if (isValid(d)) dates.push(d);
      }
      if (task.endDate) {
        const d = parseISO(task.endDate);
        if (isValid(d)) dates.push(d);
      }
      return dates;
    });


    if (allValidDates.length === 0) {
      const todayAnchor = new Date();
      return {
        start: startOfMonth(todayAnchor),
        end: endOfMonth(todayAnchor)
      };
    }

    const minDate = new Date(Math.min(...allValidDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allValidDates.map(d => d.getTime())));

    return {
      start: minDate,
      end: maxDate
    };
  };

  const dateRange = getDateRange();
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  const addTask = () => {
    if (newTask.name && newTask.startDate && newTask.endDate) {
      const startDateObj = parseISO(newTask.startDate);
      const endDateObj = parseISO(newTask.endDate);

      if (!isValid(startDateObj) || !isValid(endDateObj)) {
        alert('開始日または終了日の形式が正しくありません。');
        return;
      }
      if (startDateObj > endDateObj) {
        alert('終了日は開始日より後の日付にしてください。');
        return;
      }
      const taskToAdd: Task = {
        ...newTask,
        id: `task-${Date.now()}`
      };
      setTasks([...tasks, taskToAdd]);
      setNewTask({
        name: '',
        startDate: '',
        endDate: '',
        firstProofDate: '',
        finalProofDate: '',
        color: '#3B82F6',
        cellTexts: {},
        cellColors: {}
      });
    } else {
      alert('タスク名、開始日、終了日を入力してください。');
    }
  };

  const deleteTask = (id: string) => {
    if (window.confirm('このタスクを削除しますか？')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  const editTask = (task: Task) => {
    setEditingTask({...task});
  };

  const saveTask = () => {
    if (editingTask && editingTask.name && editingTask.startDate && editingTask.endDate) {
      const startDateObj = parseISO(editingTask.startDate);
      const endDateObj = parseISO(editingTask.endDate);
      if (!isValid(startDateObj) || !isValid(endDateObj)) {
        alert('開始日または終了日の形式が正しくありません。');
        return;
      }
      if (startDateObj > endDateObj) {
        alert('終了日は開始日より後の日付にしてください。');
        return;
      }
      setTasks(tasks.map(task => 
        task.id === editingTask.id ? editingTask : task
      ));
      setEditingTask(null);
    } else {
       alert('タスク名、開始日、終了日を入力してください。');
    }
  };

  // 日付が範囲内かどうかを確認する関数
  const isDateInTaskRange = (date: Date, task: Task): boolean => {
    if (!task.startDate || !task.endDate) return false;
    
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);
    
    if (!isValid(taskStart) || !isValid(taskEnd)) return false;
    
    return isWithinInterval(date, { start: taskStart, end: taskEnd });
  };
  
  const getMilestoneMarkerStyle = (
    milestoneDateStr: string,
    color: string
  ): React.CSSProperties | null => {
    if (!milestoneDateStr) return null;
    const milestoneDate = parseISO(milestoneDateStr);
    if (!isValid(milestoneDate)) return null;
    
    // 日付のインデックスを検索
    const dayIndex = days.findIndex(day => format(day, 'yyyy-MM-dd') === format(milestoneDate, 'yyyy-MM-dd'));
    if (dayIndex === -1) return null;
    
    // 日付セルの幅に基づいて位置を計算
    const cellWidth = 100 / days.length;
    const leftPosition = dayIndex * cellWidth + (cellWidth / 2) - 1.5; // 3pxの幅の半分を引いて中央に配置
    
    return {
      position: 'absolute',
      left: `${leftPosition}%`,
      top: '0.25rem',
      bottom: '0.25rem',
      width: '3px',
      backgroundColor: color,
      zIndex: 16,
      borderRadius: '2px',
    };
  };


  const today = new Date();
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const todayIndex = days.findIndex(day => 
    format(day, 'yyyy-MM-dd') === todayFormatted
  );

  // 認証されていない場合はパスワード認証画面を表示
  if (!authenticated) {
    return <PasswordAuth onAuthenticated={() => setAuthenticated(true)} />;
  }

  // 認証済みの場合はアプリの内容を表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ガントチャート管理
              </h1>
              <p className="text-gray-600 text-sm mt-1">プロジェクトスケジュール管理システム</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="hover:bg-green-50 hover:border-green-300 transition-all duration-200"
              aria-label="Excelファイルをインポート"
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Excelインポート
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              aria-label="Excelファイルにエクスポート"
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Excelエクスポート
            </Button>
            <Button 
              variant="outline" 
              onClick={getHistoryData}
              className="hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
              aria-label="過去のデータを復元"
            >
              <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
              履歴から復元
            </Button>
            <Button 
              variant="destructive" 
              onClick={clearData}
              className="hover:bg-red-600 transition-all duration-200"
               aria-label="すべてのデータをクリア"
            >
              <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
              データクリア
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // 認証状態をリセット
                localStorage.removeItem('gantt_authed');
                setAuthenticated(false);
              }}
              className="hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              aria-label="ログアウト"
            >
              <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
              ログアウト
            </Button>
          </div>
        </header>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={importFromExcel}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
        
        <section aria-labelledby="info-panel-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <h2 id="info-panel-heading" className="sr-only">情報パネル</h2>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-blue-800">
                データは自動的にブラウザに保存され、1か月間の履歴が保持されます。現在 {tasks.length} 件のタスクが保存されています。
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-800">
                Excelファイルでデータの読み込み・書き出しが可能です。
              </span>
            </div>
          </div>
        </section>
        
        <Card aria-labelledby="add-task-heading" className="mb-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg py-2 px-4">
            <CardTitle id="add-task-heading" className="flex items-center gap-2 text-gray-800 text-base">
              <Plus className="w-4 h-4" aria-hidden="true" />
              新しいタスクを追加
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="new-task-name" className="block text-xs font-medium text-gray-700 mb-1">タスク名</label>
                <Input
                  id="new-task-name"
                  placeholder="例：企画書作成"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9"
                  required
                />
              </div>
              <div className="w-32">
                <label htmlFor="new-start-date" className="block text-xs font-medium text-gray-700 mb-1">開始日</label>
                <Input
                  id="new-start-date"
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9"
                  required
                />
              </div>
              <div className="w-32">
                <label htmlFor="new-end-date" className="block text-xs font-medium text-gray-700 mb-1">終了日</label>
                <Input
                  id="new-end-date"
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 h-9"
                  required
                />
              </div>
              <div className="w-24">
                <label htmlFor="new-task-color" className="block text-xs font-medium text-gray-700 mb-1">色</label>
                <div className="relative">
                  <Input
                    id="new-task-color"
                    type="color"
                    aria-label="タスクの色"
                    value={newTask.color}
                    onChange={(e) => setNewTask({...newTask, color: e.target.value})}
                    className="w-full h-9 rounded-lg border cursor-pointer p-1"
                  />
                  <div 
                    className="absolute -right-3 -top-3 w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                    style={{ backgroundColor: newTask.color }}
                  />
                </div>
              </div>
              <div className="w-24 flex flex-col">
                <label className="block text-xs font-medium text-transparent mb-1 invisible">追加</label>
                <Button 
                  type="submit"
                  className="w-full h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card aria-labelledby="gantt-chart-heading" className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle id="gantt-chart-heading" className="flex items-center gap-2 text-gray-800">
                <Calendar className="w-5 h-5" aria-hidden="true" />
                ガントチャート
              </CardTitle>
              <div className="text-xs text-gray-500 bg-white/80 px-2 py-1 rounded-md shadow-sm">
                <span className="mr-1">💡</span>
                <span>セルをクリックして入力、色アイコン<span className="mx-1">🎨</span>をクリックして色を変更できます</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">タスクがありません</p>
                <p className="text-sm">上記のフォームから新しいタスクを追加するか、Excelファイルをインポートしてください。</p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ position: 'relative' }}>
                <div className="flex border-b-2 border-gray-200 bg-gray-50 gantt-header" role="rowgroup">
                  <div className="w-64 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10" role="columnheader" aria-sort="none">
                    タスク名
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex" role="row">
                      {days.map((day, index) => (
                        <div
                          key={index}
                          className={`text-xs p-2 text-center border-l border-gray-100 transition-colors duration-200 ${
                            index === todayIndex 
                              ? 'bg-blue-100 text-blue-800 font-semibold' 
                              : 'hover:bg-gray-100'
                          }`}
                          style={{ 
                            flex: '1 0 0%',
                            minWidth: '40px',
                            width: `${100 / days.length}%`
                          }}
                          role="columnheader"
                          aria-label={format(day, 'yyyy年M月d日 EEEE', { locale: ja })}
                        >
                          <div className="font-medium">{format(day, 'M/d', { locale: ja })}</div>
                          <div className="text-xs text-gray-500 mt-1">{format(day, 'E', { locale: ja })}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div role="rowgroup">
                {tasks.map((task, taskIndex) => {
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-stretch border-b border-gray-100 hover:bg-gray-50/70 transition-colors duration-200 ${
                        taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                      role="row"
                    >
                      <div className="w-64 flex-shrink-0 p-4 border-r border-gray-200 flex flex-col justify-center gantt-task-name" role="rowheader">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-800 block truncate" title={task.name}>{task.name}</span>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1 whitespace-nowrap">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {task.startDate && isValid(parseISO(task.startDate)) && format(parseISO(task.startDate), 'M/d')} 〜 {task.endDate && isValid(parseISO(task.endDate)) && format(parseISO(task.endDate), 'M/d')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => editTask(task)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                              aria-label={`タスク「${task.name}」を編集`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(task.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                              aria-label={`タスク「${task.name}」を削除`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0" role="gridcell" style={{ height: '4rem' }}>
                        {/* 日付ごとのセルをグリッドで表示 */}
                        <div className="flex h-full">
                          {days.map((day, dayIndex) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const cellKey = `${task.id}-${dateStr}`;
                            const cellText = task.cellTexts?.[cellKey] || '';
                            
                            // 日付が開始日〜終了日の範囲内かどうか確認
                            let isInRange = false;
                            let cellColor = 'transparent';
                            
                            try {
                              const taskStart = parseISO(task.startDate);
                              const taskEnd = parseISO(task.endDate);
                              
                              if (isValid(taskStart) && isValid(taskEnd)) {
                                isInRange = day >= taskStart && day <= taskEnd;
                                if (isInRange) {
                                  // 範囲内の場合、セルの色を設定
                                  cellColor = task.cellColors?.[cellKey] || task.color;
                                }
                              }
                            } catch (error) {
                              console.error('Date validation error:', error);
                            }
                            
                            // 境界のスタイルを計算
                            const taskStart = parseISO(task.startDate);
                            const taskEnd = parseISO(task.endDate);
                            const isFirstDay = isInRange && format(day, 'yyyy-MM-dd') === format(taskStart, 'yyyy-MM-dd');
                            const isLastDay = isInRange && format(day, 'yyyy-MM-dd') === format(taskEnd, 'yyyy-MM-dd');
                            
                            // 境界の角丸スタイル
                            let borderRadiusStyle = '0';
                            if (isFirstDay && isLastDay) borderRadiusStyle = '0.25rem';
                            else if (isFirstDay) borderRadiusStyle = '0.25rem 0 0 0.25rem';
                            else if (isLastDay) borderRadiusStyle = '0 0.25rem 0.25rem 0';
                            
                            return (
                              <div 
                                key={`cell-${task.id}-${dateStr}`} 
                                className="border-l border-gray-100 relative group"
                                style={{ 
                                  flex: '1 0 0%',
                                  minWidth: '40px',
                                  width: `${100 / days.length}%`
                                }}
                              >
                                {/* 範囲内のセルにのみ色付きの背景を表示 */}
                                {isInRange && (
                                  <div 
                                    className="absolute inset-x-0 top-2 bottom-2 group"
                                    style={{
                                      backgroundColor: cellColor,
                                      borderRadius: borderRadiusStyle,
                                      zIndex: 10
                                    }}
                                  >
                                    {/* セルのテキスト入力と表示を統合 - Reactステートを使用 */}
                                    <CellEditor 
                                      key={`cell-editor-${task.id}-${dateStr}`}
                                      initialText={cellText}
                                      onTextChange={(newValue) => {
                                        // 入力値を保存
                                        const newTasks = tasks.map(t => {
                                          if (t.id === task.id) {
                                            return {
                                              ...t,
                                              cellTexts: {
                                                ...(t.cellTexts || {}),
                                                [cellKey]: newValue
                                              }
                                            };
                                          }
                                          return t;
                                        });
                                        setTasks(newTasks);
                                        
                                        // 完了キーワードが入力された場合に通知を表示
                                        const completionKeywords = ['完了', '終了', 'done', 'complete', 'finished'];
                                        if (completionKeywords.some(keyword => newValue.toLowerCase().includes(keyword))) {
                                          setCompletedTask({
                                            taskId: task.id,
                                            taskName: task.name,
                                            date: format(day, 'yyyy/MM/dd')
                                          });
                                          
                                          // 5秒後に通知を自動的に閉じる
                                          setTimeout(() => {
                                            setCompletedTask(null);
                                          }, 5000);
                                        }
                                      }}
                                    />
                                    
                                    {/* セルの色変更 - カラーパレット */}
                                    <ColorPicker 
                                      key={`color-picker-${task.id}-${dateStr}`}
                                      currentColor={cellColor}
                                      onColorChange={(newColor) => {
                                        const newTasks = tasks.map(t => {
                                          if (t.id === task.id) {
                                            return {
                                              ...t,
                                              cellColors: {
                                                ...(t.cellColors || {}),
                                                [cellKey]: newColor
                                              }
                                            };
                                          }
                                          return t;
                                        });
                                        setTasks(newTasks);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 今日の日付を示す縦線 */}
                        {todayIndex >= 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70"
                            style={{
                              left: `calc(${todayIndex * (100 / days.length)}% + ${100 / days.length / 2}%)`, // 日付セルの中央に配置
                              zIndex: 20,
                            }}
                            role="separator"
                            aria-label="今日"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {editingTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="edit-task-modal-title">
            <Card className="w-full max-w-md shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle id="edit-task-modal-title" className="text-gray-800">タスクを編集</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); saveTask();}} className="space-y-4">
                  <div>
                    <label htmlFor="edit-task-name" className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
                    <Input
                      id="edit-task-name"
                      placeholder="タスク名"
                      value={editingTask.name}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, name: e.target.value} : null)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-start-date" className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={editingTask.startDate}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, startDate: e.target.value} : null)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-end-date" className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={editingTask.endDate}
                      onChange={(e) => setEditingTask(prev => prev ? {...prev, endDate: e.target.value} : null)}
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <p className="block text-sm font-medium text-gray-700 mb-1">
                      初校日・校了日はガントチャート上のセルをクリックして直接入力してください
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-task-color" className="block text-sm font-medium text-gray-700 mb-1">タスクの色</label>
                    <div className="relative">
                      <Input
                        id="edit-task-color"
                        type="color"
                        value={editingTask.color}
                        onChange={(e) => {
                          // 色を変更した際に即時反映
                          const newColor = e.target.value;
                          setEditingTask(prev => {
                            if (!prev) return null;
                            
                            // 編集中のタスクの色を更新
                            const updatedTask = {...prev, color: newColor};
                            
                            // タスクリストも更新して画面に即時反映
                            setTasks(tasks.map(t => 
                              t.id === updatedTask.id ? updatedTask : t
                            ));
                            
                            return updatedTask;
                          });
                        }}
                        className="h-12 w-full rounded-lg border-2 cursor-pointer p-1"
                      />
                      <div 
                        className="absolute -right-3 -top-3 w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                        style={{ backgroundColor: editingTask.color }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      保存
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setEditingTask(null)}
                      className="flex-1 hover:bg-gray-100 transition-all duration-200"
                    >
                      キャンセル
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 作業完了通知ポップアップ */}
        {completedTask && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 z-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="font-medium">{completedTask.taskName}</p>
                <p className="text-sm opacity-90">作業が完了しました！ ({completedTask.date})</p>
              </div>
              <button 
                onClick={() => setCompletedTask(null)} 
                className="ml-4 p-1 hover:bg-white/20 rounded-full"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
