import { useState, useEffect } from "react";
import { Select, ConfigProvider } from "antd";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { getRegions } from "../../api/api";

export default function RegionSelect({ value, onChange, placeholder, status, className = "" }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    getRegions()
      .then((data) => setRegions(data?.content ?? []))
      .catch(() => setRegions([]));
  }, []);

  const options = [...regions]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((r) => ({ value: r.id, label: r.name }));

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
        placeholder={placeholder ?? t("seller.selectRegion")}
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
