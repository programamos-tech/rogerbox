'use client';

import { X, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getIconWithBackground = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-xl bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#164151] dark:text-[#85ea10]" />
          </div>
        );
      case 'info':
        return (
          <div className="w-12 h-12 rounded-xl bg-[#164151]/10 dark:bg-white/10 flex items-center justify-center">
            <Info className="w-6 h-6 text-[#164151] dark:text-white" />
          </div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 rounded-xl bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-[#164151] dark:text-[#85ea10]" />
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-xl bg-[#85ea10]/20 dark:bg-[#85ea10]/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#164151] dark:text-[#85ea10]" />
          </div>
        );
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-500 hover:bg-red-600 text-white',
          cancel: 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white'
        };
      case 'warning':
        return {
          confirm: 'bg-[#164151] hover:bg-[#1a4d5f] text-white',
          cancel: 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white'
        };
      case 'info':
        return {
          confirm: 'bg-[#164151] hover:bg-[#1a4d5f] text-white',
          cancel: 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white'
        };
      case 'success':
        return {
          confirm: 'bg-[#85ea10] hover:bg-[#75d10e] text-[#164151] font-semibold',
          cancel: 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white'
        };
      default:
        return {
          confirm: 'bg-[#164151] hover:bg-[#1a4d5f] text-white',
          cancel: 'bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#164151] dark:text-white'
        };
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all border border-gray-200 dark:border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            {getIconWithBackground()}
            <h3 className="text-lg font-bold text-[#164151] dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#164151] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-[#164151]/80 dark:text-white/70 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-white/10">
          {cancelText && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles.cancel}`}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${buttonStyles.confirm}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Procesando...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
