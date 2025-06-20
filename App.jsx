import React, { useState, useEffect, useRef } from 'react';
import { Button } from './src/components/ui/button.jsx';
import { Input } from './src/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './src/components/ui/card.jsx';
import { Plus, Download, Upload, Trash2, Edit, Save, FileSpreadsheet, Calendar, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import './App.css';

// ローカルストレージのキー
const STORAGE_KEY = 'gantt-chart-tasks';

// デフォルトタスクデータ
const defaultTasks = [
  {
    id: 'task-1',
    name: '企画書作成',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    firstProofDate: '2025-07-03',
    finalProofDate: '2025-07-05',
    color: '#FF5733'
  },
  {
    id: 'task-2',
    name: 'デザイン作成',
    startDate: '2025-07-06',
    endDate: '2025-07-15',
    firstProofDate: '',
    finalProofDate: '',
    color: '#33FF57'
  }
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    name: '',
    startDate: '',
    endDate: '',
    firstProofDate: '',
    finalProofDate: '',
    color: '#3B82F6'
  });
  
  const fileInputRef = useRef(null);

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Failed to parse saved tasks:', error);
        setTasks(defaultTasks);
      }
    } else {
      setTasks(defaultTasks);
    }
  }, []);

  // タスクが変更されたときにローカルストレージに保存
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks]);

  // Excelファイルをエクスポート
  const exportToExcel = () => {
    const exportData = tasks.map((task, index) => ({
      'No.': index + 1,
      'タスク名': task.name,
      '開始日': task.startDate,
      '終了日': task.endDate,
      '初校日': task.firstProofDate || '',
      '校了日': task.finalProofDate || '',
      '色': task.color
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ガントチャート');

    // ファイル名に現在の日時を含める
    const now = new Date();
    const fileName = `ガントチャート_${format(now, 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  // Excelファイルをインポート
  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const importedTasks = jsonData.map((row, index) => ({
          id: `imported-task-${Date.now()}-${index}`,
          name: row['タスク名'] || row['Task Name'] || row['name'] || `タスク${index + 1}`,
          startDate: formatDateForInput(row['開始日'] || row['Start Date'] || row['startDate']),
          endDate: formatDateForInput(row['終了日'] || row['End Date'] || row['endDate']),
          firstProofDate: formatDateForInput(row['初校日'] || row['First Proof'] || row['firstProofDate']) || '',
          finalProofDate: formatDateForInput(row['校了日'] || row['Final Proof'] || row['finalProofDate']) || '',
          color: row['色'] || row['Color'] || row['color'] || '#3B82F6'
        })).filter(task => task.name && task.startDate && task.endDate);

        if (importedTasks.length > 0) {
          if (window.confirm(`${importedTasks.length}件のタスクをインポートしますか？現在のデータは上書きされます。`)) {
            setTasks(importedTasks);
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
    
    // ファイル入力をリセット
    event.target.value = '';
  };

  // 日付フォーマット関数
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    
    // 既にYYYY-MM-DD形式の場合
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // Excelの日付シリアル値の場合
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    
    // 文字列の日付を解析
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.warn('Date parsing failed:', dateValue);
    }
    
    return '';
  };

  // データをクリア
  const clearData = () => {
    if (window.confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
      localStorage.removeItem(STORAGE_KEY);
      setTasks([]);
    }
  };

  // サンプルデータを復元
  const restoreSampleData = () => {
    if (window.confirm('サンプルデータを復元しますか？現在のデータは上書きされます。')) {
      setTasks(defaultTasks);
    }
  };

  // ガントチャートの表示期間を計算
  const getDateRange = () => {
    if (tasks.length === 0) {
      const today = new Date();
      return {
        start: startOfMonth(today),
        end: endOfMonth(today)
      };
    }

    const allDates = tasks.flatMap(task => [
      parseISO(task.startDate),
      parseISO(task.endDate)
    ]);

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    return {
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    };
  };

  const dateRange = getDateRange();
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  // タスクの追加
  const addTask = () => {
    if (newTask.name && newTask.startDate && newTask.endDate) {
      const task = {
        ...newTask,
        id: `task-${Date.now()}`
      };
      setTasks([...tasks, task]);
      setNewTask({
        name: '',
        startDate: '',
        endDate: '',
        firstProofDate: '',
        finalProofDate: '',
        color: '#3B82F6'
      });
    }
  };

  // タスクの削除
  const deleteTask = (id) => {
    if (window.confirm('このタスクを削除しますか？')) {
      setTasks(tasks.filter(task => task.id !== id));
    }
  };

  // タスクの編集
  const editTask = (task) => {
    setEditingTask(task);
  };

  const saveTask = () => {
    setTasks(tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    ));
    setEditingTask(null);
  };

  // ガントバーの位置とサイズを計算
  const getBarStyle = (task) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);
    const totalDays = days.length;
    
    const startOffset = differenceInDays(taskStart, dateRange.start);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
      backgroundColor: task.color
    };
  };

  // 今日の日付を取得
  const today = new Date();
  const todayIndex = days.findIndex(day => 
    format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
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
            >
              <Upload className="w-4 h-4 mr-2" />
              Excelインポート
            </Button>
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Excelエクスポート
            </Button>
            <Button 
              variant="outline" 
              onClick={restoreSampleData}
              className="hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              サンプルデータ復元
            </Button>
            <Button 
              variant="destructive" 
              onClick={clearData}
              className="hover:bg-red-600 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              データクリア
            </Button>
          </div>
        </div>
        
        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={importFromExcel}
          style={{ display: 'none' }}
        />
        
        {/* 情報パネル */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <Save className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                データは自動的にブラウザに保存されます。現在 {tasks.length} 件のタスクが保存されています。
              </span>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Excelファイルでデータの読み込み・書き出しが可能です。
              </span>
            </div>
          </div>
        </div>
        
        {/* タスク追加フォーム */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Plus className="w-5 h-5" />
              新しいタスクを追加
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <Input
                placeholder="タスク名"
                value={newTask.name}
                onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <Input
                type="date"
                placeholder="開始日"
                value={newTask.startDate}
                onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <Input
                type="date"
                placeholder="終了日"
                value={newTask.endDate}
                onChange={(e) => setNewTask({...newTask, endDate: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <Input
                type="date"
                placeholder="初校日"
                value={newTask.firstProofDate}
                onChange={(e) => setNewTask({...newTask, firstProofDate: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <Input
                type="date"
                placeholder="校了日"
                value={newTask.finalProofDate}
                onChange={(e) => setNewTask({...newTask, finalProofDate: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={newTask.color}
                  onChange={(e) => setNewTask({...newTask, color: e.target.value})}
                  className="w-16 h-10 rounded-lg border-2 cursor-pointer"
                />
                <Button 
                  onClick={addTask} 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md"
                >
                  追加
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ガントチャート */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Calendar className="w-5 h-5" />
              ガントチャート
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">タスクがありません</p>
                <p className="text-sm">上記のフォームから新しいタスクを追加するか、Excelファイルをインポートしてください。</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* ヘッダー（日付） */}
                <div className="flex border-b-2 border-gray-200 bg-gray-50">
                  <div className="w-64 flex-shrink-0 p-4 font-semibold text-gray-700 border-r border-gray-200">
                    タスク名
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex">
                      {days.map((day, index) => (
                        <div
                          key={index}
                          className={`flex-1 text-xs p-2 text-center border-l border-gray-100 transition-colors duration-200 ${
                            index === todayIndex 
                              ? 'bg-blue-100 text-blue-800 font-semibold' 
                              : 'hover:bg-gray-100'
                          }`}
                          style={{ minWidth: '40px' }}
                        >
                          <div className="font-medium">{format(day, 'M/d', { locale: ja })}</div>
                          <div className="text-xs text-gray-500 mt-1">{format(day, 'E', { locale: ja })}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* タスク行 */}
                {tasks.map((task, taskIndex) => (
                  <div 
                    key={task.id} 
                    className={`flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                      taskIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className="w-64 flex-shrink-0 p-4 border-r border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-800 block truncate">{task.name}</span>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            {task.firstProofDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                初校: {format(parseISO(task.firstProofDate), 'M/d')}
                              </span>
                            )}
                            {task.firstProofDate && task.finalProofDate && <span>|</span>}
                            {task.finalProofDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                校了: {format(parseISO(task.finalProofDate), 'M/d')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => editTask(task)}
                            className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTask(task.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 relative h-16 p-2">
                      {/* 今日のライン */}
                      {todayIndex >= 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10 opacity-70"
                          style={{
                            left: `${(todayIndex / days.length) * 100}%`
                          }}
                        />
                      )}
                      <div
                        className="absolute top-2 h-12 rounded-lg shadow-md flex items-center justify-center text-white text-sm font-medium transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                        style={{
                          ...getBarStyle(task),
                          background: `linear-gradient(135deg, ${task.color}, ${task.color}dd)`
                        }}
                        title={`${task.name} (${task.startDate} - ${task.endDate})`}
                      >
                        <span className="truncate px-2">{task.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 編集モーダル */}
        {editingTask && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <Card className="w-full max-w-md shadow-2xl border-0 animate-in slide-in-from-bottom-4 duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="text-gray-800">タスクを編集</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Input
                  placeholder="タスク名"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({...editingTask, name: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  type="date"
                  placeholder="開始日"
                  value={editingTask.startDate}
                  onChange={(e) => setEditingTask({...editingTask, startDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  type="date"
                  placeholder="終了日"
                  value={editingTask.endDate}
                  onChange={(e) => setEditingTask({...editingTask, endDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  type="date"
                  placeholder="初校日"
                  value={editingTask.firstProofDate}
                  onChange={(e) => setEditingTask({...editingTask, firstProofDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  type="date"
                  placeholder="校了日"
                  value={editingTask.finalProofDate}
                  onChange={(e) => setEditingTask({...editingTask, finalProofDate: e.target.value})}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                />
                <Input
                  type="color"
                  value={editingTask.color}
                  onChange={(e) => setEditingTask({...editingTask, color: e.target.value})}
                  className="h-12 rounded-lg border-2 cursor-pointer"
                />
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={saveTask} 
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    保存
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingTask(null)}
                    className="flex-1 hover:bg-gray-100 transition-all duration-200"
                  >
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

