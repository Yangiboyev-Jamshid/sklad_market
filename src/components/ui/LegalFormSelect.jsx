import { Select, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { LEGAL_FORMS, getLegalFormFullName } from "../../data/legalForms";
import { useTheme } from "../../context/ThemeContext";

export default function LegalFormSelect({ value, onChange, placeholder, status, className = "" }) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const lang = (i18n.language || "ru").slice(0, 2);

  const options = LEGAL_FORMS.map((f) => ({
    value: f.code,
    label: `${f.code} — ${getLegalFormFullName(f.code, lang)}`,
  }));

  const isDark = theme === "dark";

  return (
    <ConfigProvider
      theme={{
        token: {
          colorBgContainer: isDark ? "#171717" : "#F8F9FB",
          colorBorder: isDark ? "#3B6FF6" : "#5C8DFF",
          colorText: isDark ? "#FFFFFF" : "#101828",
          colorTextPlaceholder: isDark ? "#667085" : "#98A2B3",
          colorTextQuaternary: isDark ? "#667085" : "#98A2B3",
        },
        components: {
          Select: {
            selectorBg: isDark ? "#17171700" : "#F8F9FB",
            hoverBorderColor: isDark ? "#5C8DFF" : "#3B6FF6",
            activeBorderColor: isDark ? "#5C8DFF" : "#3B6FF6",
            optionSelectedBg: isDark ? "rgba(117, 117, 117, 0.55)" : "#EFF4FF",
            optionActiveBg: isDark ? "rgba(59, 111, 246, 0.12)" : "#F5F8FF",
          },
        },
      }}
    >
      <Select
        showSearch
        allowClear={false}
        value={value || undefined}
        onChange={onChange}
        placeholder={placeholder ?? t("seller.selectLegalForm")}
        optionFilterProp="label"
        filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
        options={options}
        status={status}
        className={className}
        style={{ width: "100%" }}
        size="large"
      />
    </ConfigProvider>
  );
}
