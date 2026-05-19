import { Mail, Lock } from "lucide-react";

function Input({ label, type = "text", placeholder, value, onChange, disabled }) {
  const Icon = label.includes("Correo") ? Mail : Lock;

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
        {label}
      </label>

      <div className={`flex items-center border rounded-lg px-3 transition-colors
        ${disabled
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
          : "border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-blue-500"
        }`}>

        <Icon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full p-3 outline-none bg-transparent text-gray-800 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export default Input;
