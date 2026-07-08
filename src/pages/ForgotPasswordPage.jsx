import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock1, Eye, EyeSlash, User, Message, Sun1, Moon } from "iconsax-reactjs";
import { useTheme } from "../context/ThemeContext";
import { resetPassword, confirmResetPassword } from "../api/api";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request"); 
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleRequest = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword({ username });
      setStep("confirm");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await confirmResetPassword({ username, confirmCode: code, newPassword });
      setSuccessMsg(res?.message || "Пароль успешно изменен!");
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface dark:bg-[#121212] flex flex-col items-center justify-center px-4 py-8 sm:py-10 transition-colors relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#0D0D0D] flex items-center justify-center text-ink-600 dark:text-amber-300 shadow-card hover:scale-105 transition-transform"
        aria-label="Переключить тему"
      >
        {theme === "dark" ? <Sun1 size={18} variant="Bold" /> : <Moon size={18} variant="Bold" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6 sm:mb-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="140" height="158" viewBox="0 0 140 158" fill="none" className="text-[#464646]">
          <path d="M27.2448 32.1564L27.8161 32.2586C29.068 30.6813 30.7049 28.4725 32.1485 27.1562C33.8617 28.4031 38.3234 31.1727 38.1395 33.3507L38.4116 33.7571C28.7249 45.3463 26.254 61.3493 31.9942 75.3213C40.5443 96.1323 64.3569 106.052 85.148 97.4642L84.2159 98.9319C88.7403 97.8813 92.4615 94.2996 96.2126 92.5761C98.7747 91.399 102.3 97.9991 106.166 98.1067C106.553 96.8598 105.342 95.6922 105.589 93.304L106.146 93.1693L107.24 92.875C108.689 95.6516 110.929 100.516 112.132 103.523C108.839 105.797 102.74 109.79 99.8805 112.279L98.6877 112.191C96.4593 110.582 91.8442 107.037 90.2389 104.954C88.4066 106.121 81.9062 108.54 79.9833 108.195C79.0721 111.746 77.6699 116.589 76.9841 120.082C74.2841 120.117 71.1716 120.234 68.5053 120.113L62.6703 119.819C61.5682 116.958 60.2248 111.493 59.6629 108.478C55.9729 107.712 52.4455 106.309 48.8955 105.024C46.0272 107.349 43.2439 109.87 40.4741 112.318C36.4866 109.571 31.2685 106.175 27.6704 103.105C28.8796 99.7785 30.5641 95.9591 31.9346 92.6438C29.4383 89.0326 27.0006 85.3803 24.6232 81.6894C22.2327 81.8044 19.4289 81.9871 17.0425 81.8943C15.5239 81.8352 15.4151 81.3946 14.6549 80.4138L15.0219 80.0041C13.3152 76.6125 12.8255 70.4776 11.3105 66.2719C12.5304 65.6252 17.2245 63.0699 18.4251 62.388C18.6987 60.1989 19.9733 52.2359 20.0669 48.9798C18.5885 47.9157 12.4262 43.952 12.4533 42.2064L13.6136 42.5471C15.3523 41.4908 16.6859 36.1236 17.5072 33.7793C19.7175 33.9054 25.03 34.887 26.5499 33.7063L26.6521 32.3046L27.2448 32.1564Z" fill="currentColor" />
          <path d="M31.994 75.3203C40.5441 96.1313 64.3567 106.051 85.1478 97.4632L84.2157 98.9309C66.4093 104.179 50.1131 101.103 37.7571 86.3347C35.6548 83.8221 31.6631 78.6204 31.994 75.3203Z" fill="currentColor" />
          <path d="M20.0216 49.1328L20.7395 49.3225C21.1553 51.1421 20.0602 60.7798 20.1796 64.2096L13.6473 67.6714C14.3048 70.3708 16.5504 77.7854 15.7348 79.7409L15.0219 80.0012C13.3152 76.6096 12.8255 70.4747 11.3105 66.269C12.5304 65.6223 13.7408 64.9585 14.9414 64.2765L18.5132 62.4368C18.4028 57.1185 18.9906 54.2442 20.0216 49.1328Z" fill="currentColor" />
          <path d="M106.146 93.1694L107.241 92.875C108.689 95.6516 110.929 100.516 112.132 103.523C108.84 105.797 102.741 109.79 99.8811 112.279L98.9629 110.077C100.254 108.766 106.067 104.793 107.804 103.573C107.611 100.396 105.721 94.7829 106.146 93.1694Z" fill="currentColor" />
          <path d="M74.3483 118.29C75.6194 115.297 75.8916 111.356 77.6758 108.702C78.1577 107.985 78.9967 108.207 79.9838 108.195C79.0726 111.746 77.6705 116.59 76.9846 120.083C74.2846 120.118 71.1722 120.234 68.5059 120.113C70.0065 118.573 72.1741 118.589 74.3483 118.29Z" fill="currentColor" />
          <path d="M31.9341 92.6406L32.9081 93.011C33.6076 95.122 31.5384 99.5531 30.5562 101.564C29.7571 103.2 29.4862 103.124 27.6699 103.102C28.8791 99.7753 30.5636 95.9559 31.9341 92.6406Z" fill="currentColor" />
          <path d="M90.2402 104.957C92.2572 104.303 97.0919 108.678 98.9636 110.08L99.8818 112.283L98.689 112.194C96.4607 110.585 91.8455 107.04 90.2402 104.957Z" fill="currentColor" />
          <path d="M106.234 64.7891C106.358 66.2851 106.524 67.1777 106.105 68.6475C105.428 69.2789 105.25 69.3787 104.387 69.7888C93.9274 74.7594 83.4862 79.677 72.9334 84.4592C68.8026 86.3313 64.0537 88.6168 59.7275 90.1022C58.6993 90.4549 58.0142 90.0017 56.9077 89.628L56.5391 89.2011C58.4559 86.647 100.239 67.5936 106.234 64.7891Z" fill="currentColor" />
          <path d="M57.5629 79.0625C59.5655 79.2226 60.3761 79.8249 62.077 80.8143C58.4872 82.5772 55.4745 83.8771 52.5545 86.6836L47.0117 84.0154C50.6496 82.4545 54.0079 80.8078 57.5629 79.0625Z" fill="currentColor" />
          <path d="M50.4644 75.0547C51.7188 75.5535 52.1099 75.4599 52.7728 76.4375C51.7996 78.2537 45.3978 80.6625 42.7269 82.0481C41.5625 82.0875 40.5351 81.9418 40.2207 80.7561C41.4324 78.8096 48.1482 76.1127 50.4644 75.0547Z" fill="currentColor" />
          <path d="M86.1827 81.3248C87.6542 81.1495 89.0128 82.1361 89.3026 83.5895C89.5927 85.0428 88.7164 86.4752 87.2905 86.8788C86.2627 87.1695 85.159 86.8587 84.4337 86.075C83.7081 85.2908 83.4835 84.1663 83.853 83.1637C84.222 82.1611 85.1221 81.4509 86.1827 81.3248Z" fill="currentColor" />
          <path d="M75.2075 86.2293C76.1245 85.852 77.1736 86.0002 77.9497 86.6169C78.7259 87.2331 79.1085 88.2218 78.9488 89.2001C78.7895 90.1789 78.1135 90.9946 77.1814 91.3329C75.7822 91.8408 74.2339 91.1363 73.6966 89.7478C73.1597 88.3589 73.8308 86.7955 75.2075 86.2293Z" fill="currentColor" />
          <path d="M44.394 70.9609C45.2145 71.4491 45.487 71.53 45.9951 72.3568C45.0728 74.2914 39.2128 75.725 37.0948 76.4131L35.9977 76.6385L35.6816 76.2575C36.6979 74.3341 42.3327 71.929 44.394 70.9609Z" fill="currentColor" />
          <path d="M64.5971 90.7146C65.9791 90.4666 67.3196 91.3218 67.678 92.6799C68.0359 94.0376 67.2913 95.4429 65.9668 95.9089C65.01 96.2456 63.9453 96.0161 63.2118 95.3152C62.4787 94.6144 62.2009 93.5614 62.4935 92.59C62.7858 91.6186 63.5989 90.8936 64.5971 90.7146Z" fill="currentColor" />
          <path d="M95.9969 76.378C96.9131 76.0188 97.9527 76.1974 98.6965 76.842C99.4398 77.487 99.7645 78.4908 99.5392 79.4486C99.3134 80.4068 98.5754 81.1606 97.6223 81.4057C96.2674 81.7542 94.8756 80.9878 94.4454 79.6567C94.0148 78.3253 94.695 76.8888 95.9969 76.378Z" fill="currentColor" />
          <path d="M38.342 65.1219C39.4613 65.112 39.0467 64.9051 39.7309 65.4856C38.7372 66.4422 36.4325 67.2601 35.069 67.834C34.8909 67.8763 34.0605 67.8997 33.822 67.9116L33.8184 67.421C35.2894 66.2009 36.568 65.817 38.342 65.1219Z" fill="currentColor" />
          <path d="M76.4296 1.17969C77.372 4.20342 78.2496 7.24644 79.0619 10.3075L89.7394 13.8186C92.1036 11.4403 94.9288 8.46578 97.3915 6.27834C100.732 8.18783 105.968 10.996 108.811 13.303C107.731 16.2594 106.1 20.3756 105.217 23.3266C107.535 25.9275 110.278 28.8556 112.322 31.6071L122.435 29.9559C124.555 33.9891 126.092 38.5718 127.52 42.9068L119.642 48.5659C120.58 53.5775 121.092 57.1588 121.115 62.3072L125.366 64.6461L128.283 66.4817C127.323 71.1156 125.157 77.8988 124.485 81.836C121.133 81.9863 117.777 82.0528 114.421 82.036C112.062 86.2975 109.973 88.9086 107.242 92.8701L106.147 93.1645L105.591 93.2991C105.343 95.6873 106.555 96.8549 106.167 98.1018C102.301 97.9942 98.776 91.3941 96.2139 92.5712C92.4628 94.2947 88.7416 97.8764 84.2172 98.927L85.1493 97.4593C100.769 91.0074 110.774 75.5681 110.284 58.6717C109.795 41.7757 98.9123 26.942 82.9452 21.4056C66.9781 15.8697 49.2522 20.7841 38.4129 33.7523L38.1408 33.3458C38.3247 31.1678 33.863 28.3982 32.1498 27.1514C30.7062 28.4676 29.0693 30.6764 27.8174 32.2537L27.2461 32.1515C27.9931 30.2112 31.8477 26.2453 33.4263 24.032L33.7723 23.8805C34.4368 21.9837 32.534 17.1769 31.8526 15.0839C34.7242 13.1231 37.9105 11.2908 40.9019 9.49465C43.2616 11.4366 46.2739 14.4143 49.3162 14.1409C50.5398 13.9676 58.2884 11.2834 59.9515 10.732C60.7901 7.77482 61.6652 4.32862 62.8124 1.51838C63.9309 2.73854 74.2493 2.42366 76.0914 2.05046L76.4296 1.17969Z" fill="currentColor" />
          <path d="M29.2871 14.1771C33.2997 11.701 36.9355 9.1872 41.0934 6.84375C44.4021 9.12069 46.6337 11.1583 49.3156 14.1446C46.2734 14.4181 43.261 11.4403 40.9013 9.4984C37.9099 11.2946 34.7236 13.1269 31.852 15.0877C32.5334 17.1807 34.4363 21.9875 33.7717 23.8842L33.4257 24.0357L29.2871 14.1771Z" fill="currentColor" />
          <path d="M16.4575 31.4453C19.7756 31.6473 23.3215 32.016 26.652 32.3042L26.5498 33.7058C25.0299 34.8866 19.7173 33.905 17.507 33.7789C16.6857 36.1232 15.3522 41.4904 13.6135 42.5467L12.4531 42.206L16.4575 31.4453Z" fill="currentColor" />
          <path d="M62.8125 1.52415L63.076 0.694023C64.4884 -0.32169 71.7674 0.0523337 73.7917 0.137729C75.5936 0.213682 75.505 0.108991 76.4297 1.18547L76.0915 2.05624C74.2494 2.42943 63.931 2.74432 62.8125 1.52415Z" fill="currentColor" />
          <path d="M43.1263 49.8039L47.9773 42.7969L69.9312 54.0875L63.692 61.4611C63.3074 61.9156 62.6563 62.0372 62.1336 61.7521L43.557 51.6194C42.9026 51.2624 42.702 50.4169 43.1263 49.8039Z" fill="#DCDBDC" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M75.5586 61.3355L69.9316 54.0205L92.5128 43.9844L96.6801 49.7144C97.1291 50.3318 96.9272 51.2038 96.2525 51.561L77.1399 61.6794C76.5995 61.9655 75.9315 61.8202 75.5586 61.3355Z" fill="#DCDBDC" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M47.3478 67.0488L47.3047 53.6016L62.578 61.6625C62.7506 61.7535 62.9628 61.7177 63.0959 61.5751L69.2314 55.0003C69.4818 54.732 69.9315 54.9092 69.9315 55.2763V78.097C69.9315 78.5633 69.4408 78.8666 69.0237 78.6581L48.0413 68.1669C47.6176 67.955 47.3493 67.5225 47.3478 67.0488Z" fill="#0088FF" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M91.8193 68.1681L70.5574 78.7991C70.2699 78.9428 69.9316 78.7338 69.9316 78.4124V55.6293C69.9316 55.2285 70.4296 55.0434 70.6914 55.3468L76.0533 61.5608C76.1831 61.7112 76.3986 61.7538 76.5759 61.6642L92.5128 53.6016V67.046C92.5128 67.5212 92.2443 67.9556 91.8193 68.1681Z" fill="#0088FF" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M92.2728 43.6633L69.7891 34.3672" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M48.1701 42.3662L69.7891 34.3672" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
          <path d="M89.4617 65.4442V63.8168C89.4617 63.4954 89.1235 63.2863 88.836 63.4301L85.8093 64.9434C85.6628 65.0166 85.5703 65.1663 85.5703 65.3301V66.9576C85.5703 67.279 85.9086 67.488 86.1961 67.3443L89.2227 65.831C89.3692 65.7577 89.4617 65.608 89.4617 65.4442Z" stroke="#464646" strokeWidth="0.864759" strokeLinecap="round" />
          <path d="M70.0059 53.1729V35.4453L90.3277 43.8767L70.0059 53.1729Z" fill="#898989" stroke="#464646" strokeWidth="0.432379" strokeLinecap="round" />
          <path d="M69.5723 53.1729V35.4453L49.6828 42.7958L69.5723 53.1729Z" fill="#D9D9D9" stroke="#464646" strokeWidth="0.432379" strokeLinecap="round" />
          <path fillRule="evenodd" clipRule="evenodd" d="M91.5449 133.992C100.427 133.969 113.672 131.883 114.008 144.585C114.122 148.901 113.882 151.344 110.818 154.597C106.312 158.509 97.5781 157.478 91.5234 157.443L91.5449 133.992ZM106.356 139.476C104.151 137.747 99.467 138.11 96.7139 138.126L96.7041 153.289C100.522 153.351 104.008 153.951 106.999 151.527C109.314 148.373 109.676 142.078 106.356 139.476Z" fill="currentColor" />
          <path fillRule="evenodd" clipRule="evenodd" d="M79.6992 134.001C82.3164 141.348 86.0702 150.107 89.0215 157.478C87.2348 157.436 85.3561 157.466 83.5635 157.468C82.9593 155.832 82.4004 153.674 81.54 152.145C81.32 151.755 81.0322 151.844 80.5703 151.814C77.3829 151.781 74.1972 151.8 71.0098 151.87C70.3235 153.722 69.6291 155.57 68.9229 157.414C67.1902 157.46 65.3696 157.439 63.6289 157.445L72.4688 133.961L79.6992 134.001ZM75.9443 137.86C74.9219 140.097 73.0347 145.474 72.3184 147.896L76.6123 147.848L80.1045 147.908C79.4462 146.138 76.9869 138.846 75.9443 137.86Z" fill="currentColor" />
          <path d="M22.7131 133.948L27.836 133.945C27.8808 135.947 27.5385 142.284 28.1462 143.637C30.6022 144.134 35.1171 136.147 36.8138 133.986L42.4423 134.043C39.6631 137.672 36.9499 141.349 34.3007 145.073L39.587 152.568C40.7276 154.174 41.852 155.792 42.9585 157.421L37.0419 157.46C34.983 154.312 32.658 151.08 30.4922 147.988L27.8912 147.942C27.8472 151.089 27.8692 154.298 27.8598 157.45L22.7109 157.457L22.7131 133.948Z" fill="currentColor" />
          <path d="M8.02797 133.391C12.0266 133.113 14.4748 133.483 18.1621 134.878C18.04 136.513 17.9324 137.579 17.65 139.2C14.9018 138.134 5.62691 135.305 5.00623 140.092C6.04329 143.864 18.8458 142.19 19.302 149.059C19.7178 155.315 16.4175 156.936 10.9397 157.724C6.78582 157.793 3.95756 157.879 0 156.254C0.213295 154.775 0.374166 153.227 0.550245 151.737C2.89869 152.82 13.8296 156.363 14.277 150.319C14.4238 148.335 10.0125 147.629 8.28649 147.267C5.1773 146.615 0.478416 145.622 0.0530265 141.58C-0.422385 136.161 3.04115 133.924 8.02797 133.391Z" fill="currentColor" />
          <path d="M45.8597 133.978L50.9039 133.961L50.9099 153.272L61.3565 153.291C61.3705 154.263 61.5366 156.861 61.0464 157.44C55.9522 157.483 50.8579 157.47 45.7656 157.401C45.8096 149.62 45.7376 141.737 45.8597 133.978Z" fill="currentColor" />
          <path d="M132.784 133.93L138.861 134.01C137.717 135.647 132.79 143.066 131.712 143.961C130.335 143.673 123.354 143.521 122.174 143.963C120.005 141.305 117.127 136.858 114.979 133.94C117.125 133.96 119.274 133.969 121.423 133.967L127.05 142.066C129.001 139.382 130.914 136.67 132.784 133.93Z" fill="currentColor" />
          <path d="M122.175 143.965C123.356 143.523 130.337 143.675 131.713 143.963C128.722 148.39 125.184 153.089 122.039 157.489C119.996 157.42 117.951 157.399 115.908 157.425C118.497 153.69 121.209 150.067 123.782 146.292L122.175 143.965Z" fill="#0088FF" />
          <path d="M131.868 147.242C132.679 147.816 138.551 156.084 139.59 157.482L136.794 157.472C135.508 157.488 134.155 157.448 132.863 157.432C131.464 155.499 130.062 153.505 128.549 151.665C129.263 150.472 130.956 148.402 131.868 147.242Z" fill="#0088FF" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md bg-white dark:bg-[#0D0D0D] rounded-3xl shadow-card border border-ink-100 dark:border-[#0D0D0D] p-5 sm:p-7 transition-colors"
      >
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 mb-5 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Вернуться на страницу входа
        </button>

        <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-1">
          Восстановление пароля
        </h2>
        <p className="text-sm text-ink-400 mb-6">
          {step === "request"
            ? "Введите имя пользователя — вам будет отправлен код подтверждения."
            : step === "confirm"
            ? "Введите код и новый пароль."
            : ""}
        </p>

        {step === "done" ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl px-4 py-3">
              {successMsg}
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Войти
            </button>
          </motion.div>
        ) : step === "request" ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <InputField
              icon={User}
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitButton loading={loading} label="Отправить код" loadingLabel="Отправка..." />
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-4">
            <InputField
              icon={Message}
              placeholder="Код подтверждения"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <InputField
              icon={Lock1}
              placeholder="Новый пароль"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              trailing={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitButton loading={loading} label="Сохранить пароль" loadingLabel="Сохранение..." />
            <button
              type="button"
              onClick={() => { setStep("request"); setError(""); }}
              className="text-xs text-center text-ink-400 hover:text-ink-600 dark:hover:text-ink-200 transition-colors"
            >
              Отправить код повторно
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function InputField({ icon: Icon, trailing, ...props }) {
  return (
    <div className="flex items-center gap-3 bg-ink-50 dark:bg-[#171717] border border-transparent focus-within:border-brand-300 dark:focus-within:border-brand-500 focus-within:bg-white rounded-xl px-4 py-3.5 transition-colors">
      <Icon size={18} variant="Linear" className="text-ink-400 shrink-0" />
      <input
        {...props}
        className="flex-1 bg-transparent outline-none text-sm text-ink-900 dark:text-white placeholder:text-ink-400 min-w-0"
      />
      {trailing}
    </div>
  );
}

function ErrorMsg({ children }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
    >
      {children}
    </motion.p>
  );
}

function SubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
