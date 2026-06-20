"use client";

type Props = {
  receipt: string;
  onClose: () => void;
  onPrint?: () => void;
};

export default function ReceiptPreview({ receipt, onClose, onPrint }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#17241d]/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-[340px] flex-col rounded-[24px] bg-[#fffdf8] shadow-2xl">
        {/* Header */}
        <div className="border-b border-[#e3ded3] px-4 py-3.5 text-center font-semibold">
          Preview Struk (58mm)
        </div>

        {/* Receipt content */}
        <div className="overflow-auto bg-white px-5 py-4 font-mono text-[11px] leading-tight text-black whitespace-pre-wrap">
            {receipt}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-[#e3ded3] p-3">
          {onPrint && (
            <button
              onClick={onPrint}
              className="min-h-11 flex-1 rounded-xl bg-[#173f2d] font-semibold text-white"
            >
              Print
            </button>
          )}
          <button
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-[#dcd6ca] bg-white font-semibold text-[#626862]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
