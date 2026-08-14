import Editor from '@monaco-editor/react';

interface ReadOnlyCodeViewerProps {
  code: string;
}

// Viewer code read-only cho Submission Detail — dùng trực tiếp @monaco-editor/react
// (đã có sẵn trong bundle qua CodeEditorPanel.tsx) thay vì tái sử dụng CodeEditorPanel,
// vì component đó gắn chặt với nút Run/Stop/Compile của Sandbox đang chạy, không có
// prop readOnly — tách riêng để không đụng/rủi ro regression Sandbox đang hoạt động.
export const ReadOnlyCodeViewer = ({ code }: ReadOnlyCodeViewerProps) => {
  return (
    <div className="h-full rounded-2xl overflow-hidden border border-border bg-slate-900">
      <Editor
        height="100%"
        defaultLanguage="cpp"
        theme="vs-dark"
        value={code}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
        }}
      />
    </div>
  );
};
