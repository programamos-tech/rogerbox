export const className = {
  overlay: 'fixed inset-0 z-50 flex items-center justify-center p-4',
  backdrop:
    'absolute inset-0 bg-white/50 dark:bg-white/40 backdrop-blur-md transition-all duration-300',
  backdropShow: 'opacity-100',
  backdropHide: 'opacity-0',
  modalBase:
    'relative z-50 w-full max-w-[380px] transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]',
  modalShow: 'opacity-100 scale-100 translate-y-0',
  modalHide: 'opacity-0 scale-95 translate-y-6',
  header:
    'absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-linear-to-b from-black/70 to-transparent rounded-t-3xl',
  profileInfo: 'flex items-center gap-2',
  avatar: 'w-8 h-8 rounded-full border-2 border-lime-400 bg-zinc-800',
  username: 'text-white text-sm font-semibold',
  contentWrapper:
    'relative w-full aspect-4/5 rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10',
  image: 'object-cover',
  closeBtn:
    'bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center transition-all active:scale-90',
  footer:
    'absolute bottom-6 left-0 right-0 px-6 flex flex-col items-center gap-3',
  ctaButton:
    'w-full bg-white text-black py-3 rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-transform',
  indicator: 'w-12 h-1 bg-white/30 rounded-full',
};
