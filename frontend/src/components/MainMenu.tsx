import Y2KWindow from './Y2KWindow';

interface MainMenuProps {
  onRegister: () => void;
  onCheckLink: () => void;
  onLogin: () => void;
}

const MainMenu = ({ onRegister, onCheckLink, onLogin }: MainMenuProps) => {
  return (
    <div className="bg-secondary min-h-screen flex items-center justify-center p-4 font-sans relative">
      <Y2KWindow title="" onClose={undefined} className="max-w-md">
        <div className="flex flex-col gap-6">
          <button
            onClick={onRegister}
            className="w-full rounded-full py-4 px-6 text-lg font-black text-primary bg-transparent border-2 border-primary hover:bg-primary hover:text-white shadow-md uppercase tracking-widest transition-transform active:scale-95"
          >
            Registrar y crear red
          </button>
          <button
            onClick={onCheckLink}
            className="w-full rounded-full py-4 px-6 text-lg font-black text-primary bg-transparent border-2 border-primary hover:bg-primary hover:text-white shadow-md uppercase tracking-widest transition-transform active:scale-95"
          >
            Revisar link de referidos
          </button>
          <button
            onClick={onLogin}
            className="w-full rounded-full py-4 px-6 text-lg font-black text-primary bg-transparent border-2 border-primary hover:bg-primary hover:text-white shadow-md uppercase tracking-widest transition-transform active:scale-95"
          >
            Login
          </button>
        </div>
      </Y2KWindow>
    </div>
  );
};

export default MainMenu;
