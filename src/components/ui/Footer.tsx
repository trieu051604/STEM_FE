import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { Link } from 'react-router-dom';

const FOOTER_COLUMNS = [
  {
    title: 'Sản phẩm',
    links: [
      { name: 'Trình mô phỏng', href: '#features' },
      { name: 'Trình biên dịch code', href: '#features' },
      { name: 'Thư viện linh kiện', href: '#paths' },
      { name: 'Dành cho Nhà trường', href: '#b2b' }
    ]
  },
  {
    title: 'Tài nguyên',
    links: [
      { name: 'Tài liệu hướng dẫn', href: '#' },
      { name: 'Blog giáo dục', href: '#' },
      { name: 'Dự án mẫu', href: '#' },
      { name: 'Cộng đồng STEM', href: '#' }
    ]
  },
  {
    title: 'Pháp lý',
    links: [
      { name: 'Điều khoản dịch vụ', href: '#' },
      { name: 'Chính sách bảo mật', href: '#' },
      { name: 'Quy định bản quyền', href: '#' },
      { name: 'Liên hệ hỗ trợ', href: 'mailto:support@stemflow.vn' }
    ]
  }
];

export function Footer() {
  return (
    <footer className="bg-background text-muted-foreground py-16 border-t border-border transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          
          {/* StemFlow Branding Col */}
          <div className="lg:col-span-2 space-y-6">
            <div className="font-bold text-2xl tracking-tight text-foreground flex items-center gap-2 select-none">
              <Icon name="Cpu" className="text-brand-500 animate-pulse" />
              <span>Stem<span className="text-brand-500">Flow</span></span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Hệ sinh thái thực hành STEM trực tuyến tối ưu nhất dành cho học sinh, giáo viên và các tổ chức giáo dục. Đồng hành xây dựng tương lai công nghệ số bền vững.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-foreground hover:border-foreground/45 transition-all bg-muted p-2 rounded-lg border border-border text-muted-foreground" aria-label="Facebook">
                <Icon name="Facebook" size={16} />
              </a>
              <a href="#" className="hover:text-foreground hover:border-foreground/45 transition-all bg-muted p-2 rounded-lg border border-border text-muted-foreground" aria-label="Twitter">
                <Icon name="Twitter" size={16} />
              </a>
              <a href="#" className="hover:text-foreground hover:border-foreground/45 transition-all bg-muted p-2 rounded-lg border border-border text-muted-foreground" aria-label="Github">
                <Icon name="Github" size={16} />
              </a>
              <a href="#" className="hover:text-foreground hover:border-foreground/45 transition-all bg-muted p-2 rounded-lg border border-border text-muted-foreground" aria-label="Youtube">
                <Icon name="Youtube" size={16} />
              </a>
            </div>
          </div>

          {/* Links Cols */}
          {FOOTER_COLUMNS.map((col, idx) => (
            <div key={idx} className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono">{col.title}</h5>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((link, lidx) => (
                  <li key={lidx}>
                    {link.href.startsWith('#') ? (
                      <a href={link.href} className="hover:text-foreground transition-colors text-muted-foreground">
                        {link.name}
                      </a>
                    ) : (
                      <a href={link.href} className="hover:text-foreground transition-colors text-muted-foreground">
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Copyright strip */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span>© {new Date().getFullYear()} StemFlow Corp. Bảo lưu mọi quyền.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              All systems operational
            </span>
            <span className="text-muted-foreground/60">Made with ❤️ in Vietnam</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
