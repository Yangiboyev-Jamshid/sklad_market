import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Call,
  Sms,
  Lock1,
  Eye,
  EyeSlash,
  User,
  Sun1,
  Moon,
  Message,
  Profile,
  Warning2,
} from "iconsax-reactjs";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { login as apiLogin, registerUser } from "../api/api";

export default function LoginPage() {
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode === "register" ? "register" : "login");
  const [method, setMethod] = useState("phone");
  const [role, setRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);

  const [loginPhone, setLoginPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [regName, setRegName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");


  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const loginSubmittingRef = useRef(false);
  const regSubmittingRef = useRef(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginSubmittingRef.current) return;
    setLoginError("");
    loginSubmittingRef.current = true;
    setLoginLoading(true);

    try {
      const username = method === "phone" ? loginPhone : loginEmail;
      const data = await apiLogin({ username, password: loginPassword });

      login(data);
      navigate("/");
    } catch (err) {
      setLoginError(err.message || "Неверный логин или пароль");
    } finally {
      loginSubmittingRef.current = false;
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (regSubmittingRef.current) return;
    setRegError("");
    regSubmittingRef.current = true;
    setRegLoading(true);
    try {
      const data = await registerUser({
        firstName: regName,
        lastName: regCompany,
        username: regEmail,
        password: regPassword,
        roles: role.toUpperCase(),
      });
      if (data?.success) {
        navigate("/confirm-email", {
          state: {
            username: regEmail,
            password: regPassword,
            firstName: regName,
            lastName: regCompany,
            roles: role.toUpperCase(),
          },
        });
      }
    } catch (err) {
      setRegError(err.message);
    } finally {
      regSubmittingRef.current = false;
      setRegLoading(false);
    }
  };

  return (
    <div className="w-full sm:h-auto h-auto bg-white dark:bg-[#0D0D0D] sm:bg-[#F4F6F8] sm:dark:bg-[#121212] flex flex-col items-center justify-center px-0 py-6 sm:px-4 sm:py-10 transition-colors relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white dark:bg-[#0D0D0D] border border-ink-200 dark:border-[#1C1C1C] flex items-center justify-center text-ink-600 dark:text-amber-300 shadow-card hover:scale-105 transition-transform"
        aria-label="Переключить тему"
      >
        {theme === "dark" ? <Sun1 size={18} variant="Bold" /> : <Moon size={18} variant="Bold" />}
      </button>


      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-6 sm:mb-8"
      >
        <div className="hidden sm:flex flex-col items-center justify-center text-[#464646] dark:text-white font-bold text-[32px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="117" height="121" viewBox="0 0 117 121" fill="none">
            <path d="M15.9342 32.1564L16.5056 32.2586C17.7575 30.6813 19.3944 28.4725 20.8379 27.1562C22.5512 28.4031 27.0128 31.1727 26.8289 33.3507L27.1011 33.7571C17.4144 45.3463 14.9434 61.3493 20.6836 75.3213C29.2338 96.1323 53.0463 106.052 73.8375 97.4642L72.9053 98.9319C77.4298 97.8813 81.1509 94.2996 84.9021 92.5761C87.4641 91.399 90.9891 97.9991 94.8552 98.1067C95.2427 96.8598 94.031 95.6922 94.2789 93.304L94.8351 93.1693L95.9298 92.875C97.3783 95.6516 99.6181 100.516 100.821 103.523C97.5289 105.797 91.4296 109.79 88.5699 112.279L87.3771 112.191C85.1488 110.582 80.5336 107.037 78.9283 104.954C77.0961 106.121 70.5957 108.54 68.6727 108.195C67.7615 111.746 66.3594 116.589 65.6735 120.082C62.9736 120.117 59.8611 120.234 57.1948 120.113L51.3598 119.819C50.2577 116.958 48.9143 111.493 48.3523 108.478C44.6624 107.712 41.1349 106.309 37.5849 105.024C34.7166 107.349 31.9333 109.87 29.1636 112.318C25.176 109.571 19.9579 106.175 16.3599 103.105C17.5691 99.7785 19.2536 95.9591 20.6241 92.6438C18.1277 89.0326 15.69 85.3803 13.3127 81.6894C10.9222 81.8044 8.11838 81.9871 5.732 81.8943C4.21331 81.8352 4.10454 81.3946 3.34437 80.4138L3.71133 80.0041C2.00466 76.6125 1.51499 70.4776 0 66.2719C1.21987 65.6252 5.91396 63.0699 7.11454 62.388C7.38818 60.1989 8.66278 52.2359 8.75636 48.9798C7.2779 47.9157 1.11561 43.952 1.1427 42.2064L2.30306 42.5471C4.04174 41.4908 5.37531 36.1236 6.19662 33.7793C8.40692 33.9054 13.7194 34.887 15.2393 33.7063L15.3415 32.3046L15.9342 32.1564Z" fill="#464646" />
            <path d="M20.6834 75.3203C29.2336 96.1313 53.0461 106.051 73.8373 97.4632L72.9051 98.9309C55.0988 104.179 38.8025 101.103 26.4466 86.3347C24.3443 83.8221 20.3526 78.6204 20.6834 75.3203Z" fill="#464646" />
            <path d="M8.71107 49.1328L9.42895 49.3225C9.84474 51.1421 8.74966 60.7798 8.8691 64.2096L2.33671 67.6714C2.99426 70.3708 5.23986 77.7854 4.42428 79.7409L3.71133 80.0012C2.00466 76.6096 1.51499 70.4747 0 66.269C1.21987 65.6223 2.43029 64.9585 3.63087 64.2765L7.20264 62.4368C7.09223 57.1185 7.68001 54.2442 8.71107 49.1328Z" fill="#464646" />
            <path d="M94.8357 93.1694L95.9304 92.875C97.3789 95.6516 99.6187 100.516 100.822 103.523C97.5295 105.797 91.4302 109.79 88.5705 112.279L87.6523 110.077C88.9432 108.766 94.7565 104.793 96.4931 103.573C96.3006 100.396 94.4105 94.7829 94.8357 93.1694Z" fill="#464646" />
            <path d="M63.0377 118.29C64.3089 115.297 64.581 111.356 66.3653 108.702C66.8471 107.985 67.6861 108.207 68.6733 108.195C67.762 111.746 66.3599 116.59 65.6741 120.083C62.9741 120.118 59.8616 120.234 57.1953 120.113C58.6959 118.573 60.8635 118.589 63.0377 118.29Z" fill="#464646" />
            <path d="M20.6236 92.6406L21.5976 93.011C22.297 95.122 20.2279 99.5531 19.2457 101.564C18.4465 103.2 18.1756 103.124 16.3594 103.102C17.5686 99.7753 19.2531 95.9559 20.6236 92.6406Z" fill="#464646" />
            <path d="M78.9297 104.957C80.9467 104.303 85.7814 108.678 87.6531 110.08L88.5713 112.283L87.3785 112.194C85.1501 110.585 80.535 107.04 78.9297 104.957Z" fill="#464646" />
            <path d="M94.9231 64.7891C95.0474 66.2851 95.2132 67.1777 94.7942 68.6475C94.1177 69.2789 93.9396 69.3787 93.076 69.7888C82.6168 74.7594 72.1757 79.677 61.6229 84.4592C57.4921 86.3313 52.7431 88.6168 48.4169 90.1022C47.3887 90.4549 46.7037 90.0017 45.5971 89.628L45.2285 89.2011C47.1453 86.647 88.9284 67.5936 94.9231 64.7891Z" fill="#464646" />
            <path d="M46.2523 79.0625C48.2549 79.2226 49.0656 79.8249 50.7665 80.8143C47.1766 82.5772 44.1639 83.8771 41.2439 86.6836L35.7012 84.0154C39.339 82.4545 42.6974 80.8078 46.2523 79.0625Z" fill="#464646" />
            <path d="M39.1539 75.0547C40.4082 75.5535 40.7994 75.4599 41.4623 76.4375C40.4891 78.2537 34.0872 80.6625 31.4164 82.0481C30.2519 82.0875 29.2246 81.9418 28.9102 80.7561C30.1218 78.8096 36.8377 76.1127 39.1539 75.0547Z" fill="#464646" />
            <path d="M74.8721 81.3248C76.3436 81.1495 77.7022 82.1361 77.992 83.5895C78.2822 85.0428 77.4059 86.4752 75.98 86.8788C74.9522 87.1695 73.8485 86.8587 73.1232 86.075C72.3975 85.2908 72.173 84.1663 72.5424 83.1637C72.9114 82.1611 73.8115 81.4509 74.8721 81.3248Z" fill="#464646" />
            <path d="M63.897 86.2293C64.8139 85.852 65.863 86.0002 66.6392 86.6169C67.4154 87.2331 67.7979 88.2218 67.6382 89.2001C67.479 90.1789 66.803 90.9946 65.8708 91.3329C64.4716 91.8408 62.9233 91.1363 62.3861 89.7478C61.8492 88.3589 62.5203 86.7955 63.897 86.2293Z" fill="#464646" />
            <path d="M33.0834 70.9609C33.9039 71.4491 34.1764 71.53 34.6846 72.3568C33.7623 74.2914 27.9022 75.725 25.7843 76.4131L24.6871 76.6385L24.3711 76.2575C25.3874 74.3341 31.0221 71.929 33.0834 70.9609Z" fill="#464646" />
            <path d="M53.2866 90.7146C54.6686 90.4666 56.0091 91.3218 56.3674 92.6799C56.7253 94.0376 55.9808 95.4429 54.6562 95.9089C53.6995 96.2456 52.6347 96.0161 51.9013 95.3152C51.1682 94.6144 50.8903 93.5614 51.183 92.59C51.4752 91.6186 52.2883 90.8936 53.2866 90.7146Z" fill="#464646" />
            <path d="M84.6864 76.378C85.6025 76.0188 86.6422 76.1974 87.3859 76.842C88.1293 77.487 88.4539 78.4908 88.2286 79.4486C88.0029 80.4068 87.2649 81.1606 86.3118 81.4057C84.9569 81.7542 83.565 80.9878 83.1349 79.6567C82.7043 78.3253 83.3844 76.8888 84.6864 76.378Z" fill="#464646" />
            <path d="M27.0314 65.1219C28.1507 65.112 27.7362 64.9051 28.4204 65.4856C27.4267 66.4422 25.122 67.2601 23.7585 67.834C23.5803 67.8763 22.75 67.8997 22.5115 67.9116L22.5078 67.421C23.9789 66.2009 25.2574 65.817 27.0314 65.1219Z" fill="#464646" />
            <path d="M65.1191 1.17969C66.0615 4.20342 66.939 7.24644 67.7513 10.3075L78.4289 13.8186C80.7931 11.4403 83.6183 8.46578 86.081 6.27834C89.4213 8.18783 94.6578 10.996 97.5002 13.303C96.4203 16.2594 94.7892 20.3756 93.9063 23.3266C96.225 25.9275 98.9676 28.8556 101.011 31.6071L111.124 29.9559C113.244 33.9891 114.782 38.5718 116.21 42.9068L108.331 48.5659C109.269 53.5775 109.782 57.1588 109.805 62.3072L114.056 64.6461L116.972 66.4817C116.012 71.1156 113.846 77.8988 113.175 81.836C109.822 81.9863 106.466 82.0528 103.111 82.036C100.751 86.2975 98.6626 88.9086 95.9311 92.8701L94.8364 93.1645L94.2802 93.2991C94.0323 95.6873 95.244 96.8549 94.8565 98.1018C90.9904 97.9942 87.4654 91.3941 84.9034 92.5712C81.1522 94.2947 77.4311 97.8764 72.9066 98.927L73.8388 97.4593C89.4582 91.0074 99.4634 75.5681 98.9738 58.6717C98.4841 41.7757 87.6017 26.942 71.6346 21.4056C55.6675 15.8697 37.9417 20.7841 27.1024 33.7523L26.8302 33.3458C27.0141 31.1678 22.5525 28.3982 20.8392 27.1514C19.3957 28.4676 17.7588 30.6764 16.5069 32.2537L15.9355 32.1515C16.6826 30.2112 20.5372 26.2453 22.1158 24.032L22.4618 23.8805C23.1263 21.9837 21.2234 17.1769 20.5421 15.0839C23.4136 13.1231 26.6 11.2908 29.5914 9.49465C31.9511 11.4366 34.9634 14.4143 38.0057 14.1409C39.2292 13.9676 46.9778 11.2834 48.641 10.732C49.4795 7.77482 50.3546 4.32862 51.5019 1.51838C52.6203 2.73854 62.9387 2.42366 64.7809 2.05046L65.1191 1.17969Z" fill="#464646" />
            <path d="M17.9766 14.1771C21.9892 11.701 25.625 9.1872 29.7829 6.84375C33.0915 9.12069 35.3232 11.1583 38.0051 14.1446C34.9628 14.4181 31.9505 11.4403 29.5908 9.4984C26.5994 11.2946 23.413 13.1269 20.5415 15.0877C21.2228 17.1807 23.1257 21.9875 22.4612 23.8842L22.1152 24.0357L17.9766 14.1771Z" fill="#464646" />
            <path d="M5.14696 31.4453C8.46508 31.6473 12.011 32.016 15.3414 32.3042L15.2392 33.7058C13.7193 34.8866 8.4068 33.905 6.1965 33.7789C5.37518 36.1232 4.04162 41.4904 2.30293 42.5467L1.14258 42.206L5.14696 31.4453Z" fill="#464646" />
            <path d="M51.502 1.52415L51.7655 0.694023C53.1778 -0.32169 60.4568 0.0523337 62.4812 0.137729C64.2831 0.213682 64.1944 0.108991 65.1192 1.18547L64.781 2.05624C62.9389 2.42943 52.6204 2.74432 51.502 1.52415Z" fill="#464646" />
            <path d="M31.8157 49.8039L36.6668 42.7969L58.6207 54.0875L52.3815 61.4611C51.9969 61.9156 51.3458 62.0372 50.8231 61.7521L32.2465 51.6194C31.592 51.2624 31.3914 50.4169 31.8157 49.8039Z" fill="#DCDBDC" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M64.2481 61.3355L58.6211 54.0205L81.2023 43.9844L85.3695 49.7144C85.8186 50.3318 85.6167 51.2038 84.9419 51.561L65.8294 61.6794C65.2889 61.9655 64.6209 61.8202 64.2481 61.3355Z" fill="#DCDBDC" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M36.0373 67.0488L35.9941 53.6016L51.2674 61.6625C51.44 61.7535 51.6522 61.7177 51.7854 61.5751L57.9208 55.0003C58.1713 54.732 58.6209 54.9092 58.6209 55.2763V78.097C58.6209 78.5633 58.1302 78.8666 57.7131 78.6581L36.7307 68.1669C36.307 67.955 36.0388 67.5225 36.0373 67.0488Z" fill="#0088FF" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M80.5088 68.1681L59.2468 78.7991C58.9593 78.9428 58.6211 78.7338 58.6211 78.4124V55.6293C58.6211 55.2285 59.119 55.0434 59.3808 55.3468L64.7428 61.5608C64.8725 61.7112 65.0881 61.7538 65.2653 61.6642L81.2023 53.6016V67.046C81.2023 67.5212 80.9338 67.9556 80.5088 68.1681Z" fill="#0088FF" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M80.9623 43.6633L58.4785 34.3672" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M36.8595 42.3662L58.4785 34.3672" stroke="#464646" strokeWidth="1.72952" strokeLinecap="round" />
            <path d="M78.1512 65.4442V63.8168C78.1512 63.4954 77.8129 63.2863 77.5254 63.4301L74.4988 64.9434C74.3523 65.0166 74.2598 65.1663 74.2598 65.3301V66.9576C74.2598 67.279 74.598 67.488 74.8855 67.3443L77.9122 65.831C78.0587 65.7577 78.1512 65.608 78.1512 65.4442Z" stroke="#464646" strokeWidth="0.864759" strokeLinecap="round" />
            <path d="M58.6953 53.1729V35.4453L79.0171 43.8767L58.6953 53.1729Z" fill="#898989" stroke="#464646" strokeWidth="0.432379" strokeLinecap="round" />
            <path d="M58.2617 53.1729V35.4453L38.3723 42.7958L58.2617 53.1729Z" fill="#D9D9D9" stroke="#464646" strokeWidth="0.432379" strokeLinecap="round" />
          </svg>
          SKLAD-MARKET
        </div>
        <div className="sm:hidden flex flex-col items-center justify-center text-[#464646] dark:text-white font-bold text-[18px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="68" height="70" viewBox="0 0 68 70" fill="none">
            <path d="M9.19181 18.5484L9.5214 18.6074C10.2436 17.6975 11.1878 16.4233 12.0206 15.6641C13.0089 16.3833 15.5826 17.981 15.4765 19.2374L15.6335 19.4719C10.0456 26.1571 8.62024 35.3886 11.9315 43.4485C16.8638 55.4535 30.6002 61.1759 42.5938 56.2218L42.0561 57.0685C44.6661 56.4624 46.8126 54.3963 48.9765 53.4021C50.4545 52.7231 52.4879 56.5304 54.7181 56.5925C54.9416 55.8732 54.2426 55.1996 54.3856 53.822L54.7065 53.7443L55.3379 53.5745C56.1735 55.1762 57.4656 57.9824 58.1596 59.717C56.2604 61.0288 52.742 63.332 51.0924 64.7681L50.4043 64.717C49.1188 63.7891 46.4566 61.7438 45.5305 60.5421C44.4736 61.2154 40.7238 62.6108 39.6145 62.4119C39.0888 64.4603 38.28 67.2544 37.8844 69.2694C36.3269 69.2895 34.5314 69.3565 32.9933 69.2869L29.6273 69.1173C28.9916 67.4671 28.2166 64.3146 27.8925 62.5753C25.7639 62.1336 23.7291 61.3239 21.6812 60.5828C20.0266 61.9238 18.421 63.3784 16.8233 64.7904C14.523 63.206 11.5129 61.2469 9.43735 59.4757C10.1349 57.5568 11.1066 55.3536 11.8972 53.4412C10.4571 51.358 9.05093 49.2511 7.67954 47.122C6.30056 47.1883 4.68316 47.2937 3.30655 47.2402C2.43049 47.2061 2.36774 46.952 1.92923 46.3862L2.14091 46.1498C1.1564 44.1933 0.873934 40.6544 0 38.2283C0.703693 37.8552 3.41152 36.3812 4.10409 35.9878C4.26194 34.725 4.9972 30.1315 5.05119 28.2532C4.19832 27.6393 0.643552 25.3529 0.659179 24.3459L1.32854 24.5424C2.33152 23.9331 3.10079 20.837 3.57458 19.4846C4.84961 19.5574 7.91418 20.1236 8.79096 19.4425L8.84991 18.6339L9.19181 18.5484Z" fill="#464646" />
            <path d="M11.933 43.4453C16.8653 55.4503 30.6017 61.1727 42.5953 56.2186L42.0576 57.0653C31.7859 60.0927 22.3852 58.3184 15.2576 49.799C14.0448 48.3496 11.7422 45.349 11.933 43.4453Z" fill="#464646" />
            <path d="M5.02506 28.3438L5.43918 28.4532C5.67903 29.5028 5.04732 35.0624 5.11622 37.0409L1.34795 39.0379C1.72727 40.5951 3.02266 44.8723 2.55219 46.0003L2.14091 46.1505C1.1564 44.194 0.873934 40.655 0 38.2289C0.703693 37.8559 1.40194 37.4729 2.0945 37.0795L4.15491 36.0183C4.09122 32.9504 4.43028 31.2923 5.02506 28.3438Z" fill="#464646" />
            <path d="M54.7063 53.7479L55.3378 53.5781C56.1733 55.1798 57.4654 57.9861 58.1594 59.7206C56.2602 61.0324 52.7418 63.3356 51.0922 64.7718L50.5625 63.5014C51.3072 62.7447 54.6606 60.4529 55.6624 59.7495C55.5513 57.9164 54.461 54.6787 54.7063 53.7479Z" fill="#464646" />
            <path d="M36.3624 68.2351C37.0957 66.5085 37.2527 64.235 38.282 62.7041C38.5599 62.2906 39.0439 62.4189 39.6133 62.4121C39.0877 64.4604 38.2789 67.2546 37.8832 69.2695C36.3257 69.2897 34.5303 69.3567 32.9922 69.2871C33.8578 68.3982 35.1082 68.4077 36.3624 68.2351Z" fill="#464646" />
            <path d="M11.8973 53.4375L12.4592 53.6511C12.8627 54.8689 11.6691 57.425 11.1025 58.585C10.6415 59.5288 10.4852 59.485 9.4375 59.472C10.135 57.5532 11.1068 55.3499 11.8973 53.4375Z" fill="#464646" />
            <path d="M45.5312 60.5459C46.6948 60.1691 49.4837 62.6925 50.5634 63.5016L51.0931 64.7719L50.405 64.7208C49.1196 63.7929 46.4573 61.7476 45.5312 60.5459Z" fill="#464646" />
            <path d="M54.7566 37.375C54.8283 38.238 54.924 38.7529 54.6822 39.6008C54.292 39.965 54.1893 40.0226 53.6911 40.2592C47.6576 43.1265 41.6346 45.9632 35.5471 48.7219C33.1642 49.8018 30.4247 51.1203 27.9291 51.9771C27.336 52.1806 26.9408 51.9191 26.3025 51.7036L26.0898 51.4573C27.1956 49.984 51.2985 38.9928 54.7566 37.375Z" fill="#464646" />
            <path d="M26.6803 45.6094C27.8355 45.7017 28.3031 46.0492 29.2843 46.6199C27.2135 47.6369 25.4756 48.3867 23.7911 50.0057L20.5938 48.4665C22.6923 47.5661 24.6296 46.6161 26.6803 45.6094Z" fill="#464646" />
            <path d="M22.585 43.2969C23.3085 43.5846 23.5342 43.5306 23.9166 44.0945C23.3552 45.1423 19.6622 46.5318 18.1215 47.3311C17.4498 47.3538 16.8572 47.2697 16.6758 46.5858C17.3747 45.4629 21.2488 43.9072 22.585 43.2969Z" fill="#464646" />
            <path d="M43.1911 46.9101C44.0399 46.8089 44.8237 47.378 44.9908 48.2164C45.1582 49.0548 44.6527 49.8811 43.8302 50.1139C43.2373 50.2816 42.6006 50.1023 42.1822 49.6502C41.7636 49.1979 41.6341 48.5492 41.8472 47.9708C42.06 47.3925 42.5793 46.9828 43.1911 46.9101Z" fill="#464646" />
            <path d="M36.8571 49.7438C37.3861 49.5261 37.9913 49.6116 38.439 49.9673C38.8868 50.3228 39.1074 50.8931 39.0153 51.4575C38.9235 52.0221 38.5335 52.4927 37.9958 52.6878C37.1886 52.9808 36.2955 52.5744 35.9856 51.7734C35.6759 50.9722 36.063 50.0704 36.8571 49.7438Z" fill="#464646" />
            <path d="M19.0844 40.9375C19.5577 41.2191 19.7149 41.2658 20.008 41.7427C19.476 42.8587 16.0956 43.6857 14.8738 44.0826L14.2409 44.2127L14.0586 43.9929C14.6448 42.8833 17.8953 41.496 19.0844 40.9375Z" fill="#464646" />
            <path d="M30.7366 52.3293C31.5338 52.1863 32.3071 52.6796 32.5138 53.463C32.7203 54.2462 32.2908 55.0569 31.5267 55.3257C30.9748 55.5199 30.3606 55.3875 29.9375 54.9833C29.5146 54.579 29.3543 53.9715 29.5231 53.4112C29.6917 52.8508 30.1608 52.4326 30.7366 52.3293Z" fill="#464646" />
            <path d="M48.8522 44.0585C49.3807 43.8513 49.9805 43.9543 50.4095 44.3262C50.8383 44.6982 51.0256 45.2773 50.8956 45.8298C50.7654 46.3826 50.3397 46.8174 49.7899 46.9588C49.0083 47.1598 48.2054 46.7177 47.9572 45.9499C47.7088 45.1818 48.1012 44.3532 48.8522 44.0585Z" fill="#464646" />
            <path d="M15.5939 37.5643C16.2395 37.5586 16.0004 37.4393 16.3951 37.7741C15.8219 38.326 14.4924 38.7977 13.7058 39.1288C13.6031 39.1532 13.1241 39.1667 12.9865 39.1736L12.9844 38.8906C13.833 38.1867 14.5705 37.9653 15.5939 37.5643Z" fill="#464646" />
            <path d="M37.5634 0.679688C38.107 2.42396 38.6132 4.17935 39.0818 5.94517L45.2412 7.97056C46.6051 6.59859 48.2348 4.88273 49.6554 3.62089C51.5823 4.7224 54.6031 6.34234 56.2427 7.6731C55.6198 9.37853 54.6788 11.753 54.1695 13.4554C55.5071 14.9557 57.0892 16.6448 58.2681 18.232L64.1017 17.2795C65.3249 19.6061 66.2116 22.2496 67.0354 24.7504L62.4907 28.0149C63.0318 30.9059 63.3275 32.9717 63.3408 35.9416L65.7928 37.2909L67.4753 38.3497C66.9215 41.0229 65.672 44.9358 65.2847 47.207C63.3507 47.2937 61.4148 47.3321 59.4792 47.3224C58.118 49.7807 56.9133 51.2869 55.3375 53.5721L54.7061 53.7419L54.3852 53.8196C54.2422 55.1973 54.9412 55.8708 54.7177 56.5901C52.4875 56.528 50.4541 52.7207 48.9761 53.3997C46.8122 54.3939 44.6657 56.4601 42.0557 57.0661L42.5934 56.2194C51.6036 52.4976 57.3752 43.5913 57.0928 33.8445C56.8103 24.0979 50.5327 15.5409 41.3219 12.3472C32.1112 9.15377 21.8858 11.9886 15.6331 19.4695L15.4761 19.235C15.5822 17.9786 13.0084 16.3809 12.0201 15.6617C11.1874 16.421 10.2432 17.6951 9.521 18.605L9.19141 18.5461C9.62234 17.4268 11.8459 15.139 12.7565 13.8622L12.9561 13.7748C13.3395 12.6807 12.2418 9.90784 11.8487 8.70047C13.5052 7.56936 15.3433 6.51239 17.0689 5.47625C18.4301 6.59646 20.1678 8.3142 21.9228 8.15647C22.6286 8.05652 27.0984 6.50812 28.0578 6.19005C28.5416 4.48415 29.0464 2.49618 29.7081 0.875062C30.3534 1.57893 36.3056 1.39728 37.3683 1.182L37.5634 0.679688Z" fill="#464646" />
            <path d="M10.3711 8.17561C12.6858 6.74727 14.7831 5.29715 17.1817 3.94531C19.0903 5.25878 20.3776 6.43417 21.9247 8.15689C20.1698 8.31462 18.4321 6.59689 17.0709 5.47667C15.3452 6.51281 13.5072 7.56978 11.8507 8.70089C12.2437 9.90826 13.3414 12.6811 12.9581 13.7753L12.7585 13.8627L10.3711 8.17561Z" fill="#464646" />
            <path d="M2.97012 18.1406C4.88421 18.2571 6.9297 18.4698 8.85089 18.6361L8.79193 19.4446C7.91516 20.1258 4.85059 19.5595 3.57556 19.4868C3.10177 20.8391 2.33249 23.9352 1.32952 24.5446L0.660156 24.348L2.97012 18.1406Z" fill="#464646" />
            <path d="M29.707 0.879221L29.859 0.400353C30.6738 -0.18557 34.8727 0.0301892 36.0405 0.0794502C37.0799 0.123264 37.0288 0.0628725 37.5622 0.683846L37.3672 1.18616C36.3045 1.40144 30.3522 1.58309 29.707 0.879221Z" fill="#464646" />
            <path d="M18.3527 28.7296L21.1511 24.6875L33.8154 31.2006L30.2162 35.4541C29.9944 35.7163 29.6188 35.7864 29.3173 35.622L18.6012 29.7768C18.2236 29.5709 18.1079 29.0832 18.3527 28.7296Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M37.0624 35.3842L33.8164 31.1644L46.8426 25.375L49.2465 28.6804C49.5055 29.0366 49.389 29.5396 48.9998 29.7456L37.9746 35.5825C37.6628 35.7476 37.2775 35.6638 37.0624 35.3842Z" fill="#DCDBDC" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M20.7905 38.679L20.7656 30.9219L29.5762 35.5719C29.6757 35.6244 29.7981 35.6038 29.8749 35.5215L33.4142 31.7288C33.5587 31.574 33.8181 31.6762 33.8181 31.8879V45.0523C33.8181 45.3213 33.535 45.4962 33.2944 45.3759L21.1905 39.324C20.9461 39.2018 20.7914 38.9523 20.7905 38.679Z" fill="#0088FF" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M46.4425 39.3247L34.1774 45.4573C34.0115 45.5402 33.8164 45.4196 33.8164 45.2342V32.0916C33.8164 31.8604 34.1037 31.7536 34.2547 31.9286L37.3478 35.5132C37.4226 35.6 37.5469 35.6246 37.6492 35.5729L46.8426 30.9219V38.6774C46.8426 38.9516 46.6877 39.2021 46.4425 39.3247Z" fill="#0088FF" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M46.7043 25.1907L33.7344 19.8281" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M21.2633 24.4424L33.7344 19.8281" stroke="#464646" strokeWidth="0.997688" strokeLinecap="round" />
            <path d="M45.0846 37.7486V36.8098C45.0846 36.6244 44.8895 36.5038 44.7237 36.5867L42.9777 37.4597C42.8932 37.502 42.8398 37.5883 42.8398 37.6828V38.6216C42.8398 38.807 43.035 38.9276 43.2008 38.8447L44.9468 37.9717C45.0313 37.9295 45.0846 37.8431 45.0846 37.7486Z" stroke="#464646" strokeWidth="0.498844" strokeLinecap="round" />
            <path d="M33.8594 30.6716V20.4453L45.5822 25.309L33.8594 30.6716Z" fill="#898989" stroke="#464646" strokeWidth="0.249422" strokeLinecap="round" />
            <path d="M33.6094 30.6716V20.4453L22.136 24.6855L33.6094 30.6716Z" fill="#D9D9D9" stroke="#464646" strokeWidth="0.249422" strokeLinecap="round" />
          </svg>
          SKLAD-MARKET
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-none sm:max-w-[520px] bg-white dark:bg-[#0D0D0D] rounded-none sm:rounded-[30px] shadow-none sm:shadow-card border-0 sm:border sm:border-white/80 dark:sm:border-[#1C1C1C] px-5 pb-5 transition-colors sm:p-12"
      >
        <div className="flex flex-col items-center text-center mb-4 sm:hidden">
          <h1 className={`text-[24px] leading-tight font-extrabold text-black dark:text-white ${mode === "login" ? "mb-6" : ""}`}>
            {mode === "login" ? "Авторизация" : "Регистрация"}
          </h1>
          {mode === "register" && (
            <p className="mt-2 mb-6 text-[14px] leading-tight text-ink-400">Зарегистрируйте свой новый аккаунт</p>
          )}
        </div>

        <div className="hidden sm:flex items-center bg-ink-100 dark:bg-[#171717] rounded-full p-1 mb-10">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-colors ${mode === "login"
              ? "bg-white dark:bg-[#0D0D0D] text-black dark:text-white shadow-card"
              : "text-ink-400 hover:text-ink-600"
              }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-colors ${mode === "register"
              ? "bg-white dark:bg-[#0D0D0D] text-black dark:text-white shadow-card"
              : "text-ink-400 hover:text-ink-600"
              }`}
          >
            Регистрация
          </button>
        </div>

        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleLoginSubmit}
              className="flex flex-col gap-4 sm:h-auto h-screen"
            >
              <div className="grid grid-cols-2 gap-2.5 mb-6 sm:mb-10">
                <MethodButton
                  icon={Call}
                  label="Телефон"
                  active={method === "phone"}
                  onClick={() => { setMethod("phone"); setLoginEmail(""); setLoginError(""); }}
                />
                <MethodButton
                  icon={Message}
                  label="Email"
                  active={method === "email"}
                  onClick={() => { setMethod("email"); setLoginPhone(""); setLoginError(""); }}
                />
              </div>

              <InputField
                icon={method === "phone" ? Call : Sms}
                placeholder={method === "phone" ? "Номер телефон" : "Email адрес"}
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "numeric" : undefined}
                value={method === "phone" ? loginPhone : loginEmail}
                onChange={(e) => {
                  if (method === "phone") {
                    setLoginPhone(e.target.value.replace(/\D/g, ""));
                  } else {
                    setLoginEmail(e.target.value);
                  }
                }}
                required
              />
              <InputField
                icon={Lock1}
                placeholder="Введите пароль"
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {loginError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
                >
                  <Warning2 size={18} variant="Bold" className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </motion.p>
              )}

              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Забыли пароль?
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading || !(method === "phone" ? loginPhone : loginEmail) || !loginPassword}
                className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:bg-[#C4C4C4] disabled:text-white disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-3 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Входим...
                  </>
                ) : (
                  "Войти"
                )}
              </button>

              <div className="relative flex items-center justify-center my-1">
                <div className="absolute inset-x-0 h-px bg-ink-200 dark:bg-ink-700" />
                <span className="relative bg-white dark:bg-[#0D0D0D] px-3 text-xs text-ink-400">или</span>
              </div>

              <button
                type="button"
                className="w-full border border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600 font-semibold py-3.5 rounded-xl text-ink-700 dark:text-ink-200 transition-colors"
              >
                Войти через SKLAD ERP
              </button>
              <p className="text-center text-[11px] text-ink-400 mt-1 sm:hidden">
                Нет учетной записи?{" "}
                <button type="button" onClick={() => setMode("register")} className="font-medium text-black dark:text-white">
                  Регистрация
                </button>
              </p>
            </motion.form>
          ) : mode === "register" ? (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRegisterSubmit}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-2.5 mb-6 sm:mb-10">
                <RoleButton label="Покупатель" sub="Ищу товары" active={role === "buyer"} onClick={() => setRole("buyer")} />
                <RoleButton label="Продавец" sub="Продаю товары" active={role === "seller"} onClick={() => setRole("seller")} />
              </div>
              <InputField
                icon={Profile}
                placeholder="Имя"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
              <InputField
                icon={User}
                placeholder="Фамилия"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
                required
              />
              <InputField
                icon={Sms}
                placeholder="Номер телефона или Email адрес"
                type="text"
                inputMode="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <InputField
                icon={Lock1}
                placeholder="Введите пароль"
                type={showPassword ? "text" : "password"}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                trailing={
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-ink-400">
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {regError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5"
                >
                  <Warning2 size={18} variant="Bold" className="shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </motion.p>
              )}

              <p className="text-[12px] text-center sm:text-start sm:text-[16px] my-6 text-ink-400 leading-snug">
                Регистрируясь, вы соглашаетесь с{" "}
                <span className="text-brand-600 dark:text-brand-400 font-medium">условиями использования</span> и{" "}
                <span className="text-brand-600 dark:text-brand-400 font-medium">политикой конфиденциальности</span>
              </p>

              <button
                type="submit"
                disabled={regLoading || !regName || !regCompany || !regEmail || !regPassword}
                className="w-full bg-brand-600 dark:bg-[#C4C4C4] dark:text-[#0D0D0D] hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors mt-6 sm:mt-3 flex items-center justify-center gap-2"
              >
                {regLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Регистрируем...
                  </>
                ) : (
                  "Регистрация"
                )}
              </button>
              <p className="text-center text-[11px] text-ink-400 mt-1 sm:hidden">
                Уже есть учетная запись?{" "}
                <button type="button" onClick={() => setMode("login")} className="font-medium text-black dark:text-white">
                  Login
                </button>
              </p>
            </motion.form>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function MethodButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-colors ${active
        ? "bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400"
        : "border-ink-200 dark:border-[#1C1C1C] text-ink-500 dark:text-ink-400 hover:border-ink-300 dark:hover:border-ink-600"
        }`}
    >
      <Icon size={16} variant="Linear" />
      {label}
    </button>
  );
}

function RoleButton({ label, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl border transition-colors ${active
        ? "bg-brand-50 dark:bg-brand-500/15 border-brand-200 dark:border-brand-500/40"
        : "border-ink-200 dark:border-[#1C1C1C] hover:border-ink-300 dark:hover:border-ink-600"
        }`}
    >
      <span className={`text-sm font-semibold ${active ? "text-brand-600 dark:text-brand-400" : "text-ink-700 dark:text-ink-200"}`}>{label}</span>
      <span className="text-[11px] text-ink-400">{sub}</span>
    </button>
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
