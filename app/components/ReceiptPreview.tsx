"use client";

type Props = {
  receipt: string;
  onClose: () => void;
  onPrint?: () => void;
};

export default function ReceiptPreview({ receipt, onClose, onPrint }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-[320px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 py-2 border-b font-semibold text-center">
          Preview Struk (58mm)
        </div>

        {/* Receipt content */}
        <div className="px-4 py-3 overflow-auto text-[11px] leading-tight font-mono whitespace-pre-wrap text-black">
            {receipt}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-3 border-t">
          {onPrint && (
            <button
              onClick={onPrint}
              className="flex-1 bg-green-600 text-white py-2 rounded"
            >
              Print
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 text-white py-2 rounded"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}