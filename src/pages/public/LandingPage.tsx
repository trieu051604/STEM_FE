import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen flex flex-col">

{/*  TopAppBar  */}
<header className="flex justify-between items-center px-8 h-20 w-full z-50 max-w-full fixed top-0 bg-surface-container-low/80 dark:bg-surface-container-low/80 backdrop-blur-xl">
<div className="font-headline font-black text-2xl tracking-tighter text-primary dark:text-primary-fixed-dim">StemFlow</div>
<nav className="hidden md:flex gap-8 items-center">
<a className="text-on-surface-variant dark:text-on-tertiary-container hover:text-primary transition-colors font-label text-label-md" href="#">Chương trình</a>
<a className="text-on-surface-variant dark:text-on-tertiary-container hover:text-primary transition-colors font-label text-label-md" href="#">Phòng thí nghiệm</a>
<a className="text-on-surface-variant dark:text-on-tertiary-container hover:text-primary transition-colors font-label text-label-md" href="#">Giải pháp</a>
<a className="text-on-surface-variant dark:text-on-tertiary-container hover:text-primary transition-colors font-label text-label-md" href="#">Về chúng tôi</a>
</nav>
<div className="flex items-center gap-4">
<Link to="/login" className="px-6 py-2 rounded-full font-label text-sm font-bold text-primary hover:bg-surface-container/50 transition-all active:scale-95 transition-transform duration-200">Đăng nhập</Link>
<Link to="/register" className="bg-secondary px-6 py-2 rounded-full font-label text-sm font-bold text-on-secondary hover:opacity-90 active:scale-95 transition-transform duration-200 shadow-lg shadow-secondary/20">Bắt đầu học</Link>
</div>
</header>
<main className="pt-20">
{/*  Hero Section  */}
<section className="relative min-h-[921px] flex items-center overflow-hidden px-8">
<div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
<div className="space-y-8">
<div className="inline-flex items-center gap-2 bg-primary-fixed/30 text-on-primary-fixed-variant px-4 py-2 rounded-full font-label text-sm font-semibold">
<span className="material-symbols-outlined text-[18px]">science</span> Tiêu chuẩn giáo dục 4.0
                    </div>
<h1 className="font-headline font-extrabold text-6xl md:text-7xl text-primary leading-[1.1] tracking-tight">
                        Khai phóng tiềm năng <span className="text-secondary">khoa học</span>
</h1>
<p className="text-xl text-on-surface-variant max-w-lg leading-relaxed">
                        Hệ sinh thái học tập STEM tích hợp trí tuệ nhân tạo và phòng thí nghiệm ảo hiện đại nhất dành cho các nhà khoa học tương lai.
                    </p>
<div className="flex flex-wrap gap-4">
<Link to="/courses" className="bg-primary text-on-primary px-8 py-4 rounded-full font-bold text-lg inline-flex items-center hover:shadow-xl transition-all active:scale-95">Khám phá ngay</Link>
<Link to="/login" className="border border-outline px-8 py-4 rounded-full font-bold text-lg inline-flex items-center hover:bg-surface-container transition-all active:scale-95">Xem bản Demo</Link>
</div>
</div>
<div className="relative">
<div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-fixed/20 rounded-full blur-3xl"></div>
<div className="absolute -bottom-10 -left-10 w-72 h-72 bg-secondary-fixed/30 rounded-full blur-3xl"></div>
<div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-surface-container-lowest">
<img className="w-full h-auto aspect-video object-cover" data-alt="A focused high school student wearing safety goggles and a white lab coat working in a modern, brightly lit science laboratory. The environment is clean and professional with sleek glass equipment and digital monitors showing chemical formulas in the background. The lighting is soft and airy, creating a high-end educational atmosphere with a color palette of deep teal and warm amber accents. The mood is one of intense curiosity and academic excellence." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuoWbE-P6oxDMvhaLzaubjeD6lvI8HCAF0aEi2ZH_DJAOsR4c8ptU5ekb7c5HuNl_-IRu4BOJc3xDBlDVHFG1WelRU3h7Vrmqn-l627xSncl-_8REk28O-tVmThhLYzbM1Q_ibINc_5jv5T9wC0pMVqveLulXUlF7EIPckddR6fKwBqQ078N7RRdBMZFwuIESkji2OV4URGZgrLKQu0ZpsrPYsL1zFDxemTcubjXUxbnaAZ-UkczZEddoIakCMHCD3rKknz-YWbKw"/>
</div>
</div>
</div>
</section>
{/*  Bento Features Section  */}
<section className="py-24 bg-surface-container-low">
<div className="container mx-auto px-8">
<div className="mb-16 text-center max-w-3xl mx-auto">
<h2 className="font-headline font-extrabold text-4xl text-primary mb-6">Môi trường học tập không giới hạn</h2>
<p className="text-on-surface-variant text-lg">StemFlow mang đến những công cụ mạnh mẽ nhất để xóa nhòa khoảng cách giữa lý thuyết và thực tiễn.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/*  Feature 1: Virtual Lab  */}
<div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 group hover:shadow-xl transition-all overflow-hidden relative">
<div className="relative z-10">
<span className="material-symbols-outlined text-4xl text-secondary mb-4">biotech</span>
<h3 className="font-headline font-bold text-2xl text-primary mb-3">Phòng Lab ảo độc quyền</h3>
<p className="text-on-surface-variant max-w-md mb-6">Mô phỏng chính xác các thí nghiệm hóa học, vật lý và sinh học trong môi trường 3D tương tác. An toàn tuyệt đối, không giới hạn vật liệu.</p>
<a className="text-primary font-bold inline-flex items-center gap-2 group" href="#">Khám phá Lab ảo <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span></a>
</div>
<div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-20 transition-opacity">
<span className="material-symbols-outlined text-[300px] absolute -bottom-20 -right-20">science</span>
</div>
</div>
{/*  Feature 2: Smart Class  */}
<div className="bg-primary text-on-primary rounded-xl p-8 hover:shadow-xl transition-all">
<span className="material-symbols-outlined text-4xl text-primary-fixed mb-4">groups</span>
<h3 className="font-headline font-bold text-2xl mb-3">Quản lý lớp học thông minh</h3>
<p className="text-on-primary/80 mb-6">Theo dõi tiến độ học tập, chấm điểm tự động và phân tích điểm mạnh của từng học sinh dựa trên dữ liệu AI.</p>
<span className="material-symbols-outlined text-6xl opacity-20 block text-right">analytics</span>
</div>
{/*  Feature 3: Documentation  */}
<div className="bg-surface-container-lowest rounded-xl p-8 hover:shadow-xl transition-all border border-transparent hover:border-outline-variant">
<span className="material-symbols-outlined text-4xl text-primary mb-4">library_books</span>
<h3 className="font-headline font-bold text-xl text-primary mb-3">Kho tài liệu STEM</h3>
<p className="text-on-surface-variant mb-6">Hàng ngàn bài giảng, giáo án và video hướng dẫn được biên soạn bởi các chuyên gia đầu ngành.</p>
<div className="flex -space-x-3">
<div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-primary-fixed"></div>
<div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-secondary-fixed"></div>
<div className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-tertiary-fixed"></div>
</div>
</div>
{/*  Feature 4: High-end Interface  */}
<div className="md:col-span-2 bg-tertiary text-on-tertiary rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden">
<div className="flex-1">
<h3 className="font-headline font-bold text-2xl mb-3 text-tertiary-fixed">Giao diện "Phòng Thí Nghiệm Tư Duy"</h3>
<p className="text-on-tertiary/70 leading-relaxed mb-6">Một không gian học thuật cao cấp, nơi sự chính xác của khoa học gặp gỡ sự tinh tế của thiết kế biên tập.</p>
<button className="bg-tertiary-fixed text-on-tertiary-fixed px-6 py-2 rounded-full font-bold text-sm">Trải nghiệm UI</button>
</div>
<div className="flex-1 bg-surface-container-lowest/10 backdrop-blur rounded-lg p-4 border border-white/10">
<div className="flex gap-2 mb-4">
<div className="w-3 h-3 rounded-full bg-error"></div>
<div className="w-3 h-3 rounded-full bg-secondary-container"></div>
<div className="w-3 h-3 rounded-full bg-primary-container"></div>
</div>
<div className="space-y-3">
<div className="h-2 w-3/4 bg-white/20 rounded"></div>
<div className="h-2 w-1/2 bg-white/20 rounded"></div>
<div className="h-2 w-full bg-white/20 rounded"></div>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  Target Audience Section  */}
<section className="py-24 px-8 overflow-hidden">
<div className="container mx-auto">
<div className="flex flex-col md:flex-row gap-16 items-center mb-20">
<div className="md:w-1/2">
<h2 className="font-headline font-extrabold text-5xl text-primary mb-8 tracking-tight">Được thiết kế cho mọi thành viên</h2>
<div className="space-y-6">
<div className="flex gap-6 items-start">
<div className="w-12 h-12 shrink-0 bg-primary-fixed rounded-xl flex items-center justify-center text-primary">
<span className="material-symbols-outlined">school</span>
</div>
<div>
<h4 className="font-headline font-bold text-xl text-primary mb-2">Dành cho Nhà trường</h4>
<p className="text-on-surface-variant">Nâng tầm vị thế giáo dục với công nghệ hiện đại và chuẩn hóa quy trình đào tạo STEM chuyên sâu.</p>
</div>
</div>
<div className="flex gap-6 items-start">
<div className="w-12 h-12 shrink-0 bg-secondary-fixed rounded-xl flex items-center justify-center text-secondary">
<span className="material-symbols-outlined">person_pin</span>
</div>
<div>
<h4 className="font-headline font-bold text-xl text-primary mb-2">Dành cho Giáo viên</h4>
<p className="text-on-surface-variant">Tiết kiệm 60% thời gian soạn giáo án và quản lý lớp học. Công cụ trực quan giúp bài giảng sinh động hơn.</p>
</div>
</div>
<div className="flex gap-6 items-start">
<div className="w-12 h-12 shrink-0 bg-tertiary-fixed rounded-xl flex items-center justify-center text-tertiary">
<span className="material-symbols-outlined">emoji_objects</span>
</div>
<div>
<h4 className="font-headline font-bold text-xl text-primary mb-2">Dành cho Học sinh</h4>
<p className="text-on-surface-variant">Học tập qua trải nghiệm thực tế. Tự do sáng tạo, thí nghiệm và khám phá thế giới khoa học.</p>
</div>
</div>
</div>
</div>
<div className="md:w-1/2 relative">
<div className="aspect-square bg-surface-container rounded-3xl overflow-hidden relative">
<img className="w-full h-full object-cover" data-alt="A clean, minimalist digital collage showing three distinct scenes: a modern school administrative office with minimalist white furniture, a teacher using a large interactive digital whiteboard with colorful scientific diagrams, and a diverse group of teenagers enthusiastically working on a robotics project in a sunny classroom. The entire image has a high-end editorial feel with ample white space, sophisticated lighting, and a cohesive professional color scheme dominated by deep teals and soft greys." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCfIs3h1XBxy7LJgusxFxz2nd5X1r13HSFk_uyfq3zcNdaeT1VS6tww88GbX6iuvaSb4Ayo3FF0w2RLGBp_LPfD0DODS1j32QkR9F36bBNXxIAI-62nSLFgPVUS0vLX4k55WHZkYMB-E5_5H-4rbH5csNX200n1X6OwATJWR6GM7kdI_4pdMHrZynz6oma0823q4a-fIrihowl052Ydl65tDvJtiMhex451fbjvcTYGMDhf7SZbMXUtgWlsjnsnJR3fgRzuhYlOM0"/>
<div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
<div className="absolute bottom-8 left-8 text-on-primary">
<p className="text-4xl font-headline font-extrabold mb-2">10,000+</p>
<p className="text-sm font-label uppercase tracking-widest opacity-80">Người dùng đã tin tưởng</p>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  CTA Section  */}
<section className="py-20 px-8">
<div className="container mx-auto">
<div className="bg-primary-container rounded-xl p-12 md:p-20 text-center relative overflow-hidden">
<div className="absolute top-0 right-0 w-64 h-64 bg-on-primary-container/10 rounded-full -mr-32 -mt-32"></div>
<div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full -ml-24 -mb-24"></div>
<div className="relative z-10">
<h2 className="font-headline font-extrabold text-4xl md:text-5xl text-on-primary-container mb-8">Sẵn sàng bắt đầu hành trình khoa học?</h2>
<div className="flex flex-col md:flex-row gap-4 justify-center items-center">
<Link to="/register" className="bg-secondary text-on-secondary px-10 py-4 rounded-full font-bold text-lg inline-flex items-center justify-center hover:shadow-2xl transition-all shadow-xl shadow-secondary/30">Đăng ký ngay bây giờ</Link>
<button className="text-on-primary-container font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all">Liên hệ tư vấn giải pháp</button>
</div>
</div>
</div>
</div>
</section>
</main>
{/*  Footer  */}
<footer className="flex flex-col md:flex-row justify-between items-center px-12 py-10 w-full mt-auto bg-surface-container-low dark:bg-tertiary w-full rounded-t-xl">
<div className="flex flex-col items-start gap-4 mb-8 md:mb-0">
<div className="font-headline font-bold text-lg text-primary dark:text-primary-fixed-dim">StemFlow</div>
<p className="font-body text-label-md text-on-surface-variant dark:text-on-tertiary-container/70 max-w-xs">
                © 2024 StemFlow. Môi trường nuôi dưỡng những nhà khoa học tương lai.
            </p>
</div>
<div className="flex flex-wrap gap-8 justify-center">
<a className="font-body text-label-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors opacity-80 hover:opacity-100 transition-opacity" href="#">Điều khoản sử dụng</a>
<a className="font-body text-label-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors opacity-80 hover:opacity-100 transition-opacity" href="#">Chính sách bảo mật</a>
<a className="font-body text-label-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors opacity-80 hover:opacity-100 transition-opacity" href="#">Liên hệ hỗ trợ</a>
<a className="font-body text-label-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-secondary dark:hover:text-secondary-fixed-dim transition-colors opacity-80 hover:opacity-100 transition-opacity" href="#">Tài liệu API</a>
</div>
<div className="flex gap-4 mt-8 md:mt-0">
<button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container dark:bg-surface-container-high/30 hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined text-[20px]">public</span>
</button>
<button className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container dark:bg-surface-container-high/30 hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined text-[20px]">mail</span>
</button>
</div>
</footer>

    </div>
  );
}
