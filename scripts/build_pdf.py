#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# AARR — بناء ملف PDF للحزمة من guide.md + templates.md (عربي RTL، خط أميري)
# الاستعمال: python3 scripts/build_pdf.py
# يعتمد: pip install fpdf2 arabic-reshaper python-bidi
import re
import sys
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent
GUIDE = ROOT / "product" / "guide.md"
TEMPLATES = ROOT / "product" / "templates.md"
HERO = ROOT / "product" / "assets" / "hero.jpg"
FONTS = ROOT / "product" / "fonts"
OUT = ROOT / "product" / "AARR-AI-Freelance-Guide-AR.pdf"

INK = (14, 43, 43)
GOLD = (227, 185, 100)
GOLD_DARK = (164, 117, 42)
IVORY = (247, 243, 234)
GREY = (91, 111, 109)

# أحرف غير مدعومة في خط Amiri نستبدلها ببدائل آمنة
REPL = {
    "✓": "•", "✦": "•", "✔": "•", "⭐": "", "🤍": "", "✅": "•", "✗": "x", "←": "-", "→": "-",
    "’": "'", "–": "—", "“": "«", "”": "»", "…": "...", "\u200f": "", "\u200e": "",
}
SAFE = re.compile(r"[^\u0600-\u06FF\u0750-\u077F\u0660-\u0669A-Za-z0-9\s.,;:!?%&()\[\]{}/@+=*_'«»—،؛؟-]")

def strip_md(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    return text.replace("**", "").replace("*", "")

def shape(text: str) -> str:
    for k, v in REPL.items():
        text = text.replace(k, v)
    text = SAFE.sub("", text)
    return get_display(arabic_reshaper.reshape(text))

def clean_inline(text: str):
    """يرجع قائمة (segment, bold) بعد معالجة **عريض** وروابط markdown."""
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)   # [t](u) -> t
    parts = text.split("**")
    segs = []
    for i, part in enumerate(parts):
        if not part:
            continue
        part = part.replace("*", "")
        segs.append((part, i % 2 == 1))
    return segs

def parse_blocks(md: str):
    blocks, buf, table_buf = [], [], []
    def flush_para():
        nonlocal buf
        if buf:
            blocks.append(("p", " ".join(buf))); buf = []
    def flush_table():
        nonlocal table_buf
        if table_buf:
            blocks.append(("table", table_buf)); table_buf = []
    for raw in md.splitlines():
        line = raw.rstrip()
        if not line.strip():
            flush_para(); flush_table(); continue
        if line.strip() == "---":
            flush_para(); flush_table(); continue
        if line.startswith("|"):
            flush_para()
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(set(c) <= set("-: ") for c in cells):   # سطر الفاصل
                continue
            table_buf.append(cells); continue
        flush_table()
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            flush_para(); blocks.append((f"h{len(m.group(1))}", m.group(2).strip())); continue
        m = re.match(r"^>\s?(.*)$", line)
        if m:
            flush_para(); blocks.append(("quote", m.group(1).strip())); continue
        m = re.match(r"^[-*]\s+(.*)$", line)
        if m:
            flush_para(); blocks.append(("li", m.group(1).strip())); continue
        m = re.match(r"^(\d+)\.\s+(.*)$", line)
        if m:
            flush_para(); blocks.append(("oli", (m.group(1) + ". " + m.group(2)).strip())); continue
        buf.append(line.strip())
    flush_para(); flush_table()
    return blocks

class Book(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.add_font("amiri", "", str(FONTS / "Amiri-Regular.ttf"))
        self.add_font("amiri", "B", str(FONTS / "Amiri-Bold.ttf"))
        self.add_font("amiri", "I", str(FONTS / "Amiri-Slanted.ttf"))
        self.set_auto_page_break(auto=True, margin=17)
        self.set_margins(16, 15, 16)
        self.alias_nb_pages()

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("amiri", "", 8)
        self.set_text_color(*GREY)
        self.cell(178, 6, shape("AARR — آفاق الربح الرقمي"), align="C")
        self.ln(4)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-13)
        self.set_draw_color(*GOLD)
        self.set_line_width(0.4)
        self.line(16, self.get_y(), 194, self.get_y())
        self.set_font("amiri", "", 8)
        self.set_text_color(*GREY)
        self.cell(0, 6, shape(f"صفحة {self.page_no()}  |  © 2026 AARR — للاستعمال الشخصي للمشتري فقط"), align="C")

    def fit_size(self, text, sizes, bold=True):
        max_w = self.w - self.l_margin - self.r_margin - 4
        for s in sizes:
            self.set_font("amiri", "B" if bold else "", s)
            if self.get_string_width(shape(text)) <= max_w:
                return s
        return sizes[-1]

    def rtl_line(self, text, size=12, bold=False, color=None, h=7.2, align="R"):
        self.set_font("amiri", "B" if bold else "", size)
        if color:
            self.set_text_color(*color)
        else:
            self.set_text_color(*INK)
        x, w = self.l_margin, self.w - self.l_margin - self.r_margin
        words = text.split(" ")
        line = ""
        for word in words:
            trial = (line + " " + word).strip()
            if self.get_string_width(shape(trial)) > w and line:
                self.cell(w, h, shape(line), align=align, new_x="LMARGIN", new_y="NEXT")
                line = word
            else:
                line = trial
        if line:
            self.cell(w, h, shape(line), align=align, new_x="LMARGIN", new_y="NEXT")

    def paragraph(self, text, size=11.5, color=None, h=6.6):
        """فقرة مع دعم **العريض** جزئياً (تُسطّح لعريض كلي إن وجد)."""
        segs = clean_inline(text)
        merged = "".join(s for s, _ in segs)
        self.rtl_line(merged, size=size, color=color, h=h)
        self.ln(1.2)

def build():
    pdf = Book()
    pdf.set_title("حزمة الذكاء الاصطناعي للمستقل المغربي")
    pdf.set_author("AARR — آفاق الربح الرقمي")
    pdf.set_subject("دليل عملي + قوالب للعمل الحر بالمغرب")

    # ---------- الغلاف ----------
    pdf.add_page()
    pdf.set_fill_color(*INK)
    pdf.rect(0, 0, 210, 297, style="F")
    pdf.set_fill_color(*GOLD)
    pdf.rect(0, 288, 210, 9, style="F")
    # صورة المشهد المغربي داخل قوس
    arch_w, arch_h = 88, 126
    ax, ay = (210 - arch_w) / 2, 22
    pdf.image(str(HERO), x=ax, y=ay, w=arch_w, h=arch_h)
    pdf.set_draw_color(*GOLD)
    pdf.set_line_width(1.1)
    pdf.rect(ax - 2.5, ay - 2.5, arch_w + 5, arch_h + 5)
    pdf.set_y(ay + arch_h + 10)
    pdf.set_font("amiri", "B", 15)
    pdf.set_text_color(*GOLD)
    pdf.cell(0, 8, shape("AARR — آفاق الربح الرقمي"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("amiri", "B", 26)
    pdf.set_text_color(*IVORY)
    pdf.multi_cell(0, 11, shape("حزمة الذكاء الاصطناعي"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.multi_cell(0, 11, shape("للمستقل المغربي"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)
    pdf.set_font("amiri", "", 12.5)
    pdf.set_text_color(*IVORY)
    pdf.multi_cell(0, 7, shape("الدليل العملي + القوالب الـ 12 + خطة الـ 30 يوم"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("amiri", "", 10)
    pdf.set_text_color(*GOLD)
    pdf.multi_cell(0, 6, shape("طبعة نوفمبر 2026  |  للمستقل المغربي العربي والفرنسي  |  للاستعمال الشخصي للمشتري فقط"), align="C", new_x="LMARGIN", new_y="NEXT")

    guide_md = GUIDE.read_text(encoding="utf-8")
    tpl_md = TEMPLATES.read_text(encoding="utf-8")
    blocks = parse_blocks(guide_md)
    blocks_t = parse_blocks(tpl_md)

    # ---------- صفحة المحتويات ----------
    pdf.add_page()
    pdf.set_fill_color(*IVORY)
    pdf.rect(0, 0, 210, 297, style="F")
    pdf.set_font("amiri", "B", 22)
    pdf.set_text_color(*INK)
    pdf.cell(0, 12, shape("محتويات الحزمة"), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_draw_color(*GOLD); pdf.set_line_width(0.8); pdf.line(120, pdf.get_y(), 194, pdf.get_y()); pdf.ln(4)
    pdf.set_font("amiri", "", 12)
    for kind, content in blocks:
        if kind == "h2":
            pdf.set_text_color(*INK)
            pdf.cell(0, 8.5, shape("—  " + content), align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(*GOLD_DARK)
    pdf.cell(0, 8.5, shape("—  ملحق: القوالب الـ 12 الجاهزة (عربي + فرنسي)"), align="R", new_x="LMARGIN", new_y="NEXT")

    # ---------- جسم الدليل ----------
    def render(blocks):
        started = False
        for kind, content in blocks:
            if kind == "h2":
                started = True
            if not started:
                continue  # الغلاف والمحتوى التمهيدي يغطيانه
            if kind == "h2":
                if content.startswith("الفصل") or content.startswith("ملحق"):
                    pdf.add_page()
                size = pdf.fit_size("  " + content, [17, 15, 13.5, 12, 11])
                pdf.set_fill_color(*INK)
                pdf.set_font("amiri", "B", size)
                pdf.set_text_color(*GOLD)
                pdf.set_x(16)
                pdf.cell(178, 11, shape("  " + content), align="R", fill=True, new_x="LMARGIN", new_y="NEXT")
                pdf.ln(2.5)
            elif kind == "h3":
                pdf.set_font("amiri", "B", pdf.fit_size(content, [13.5, 12, 11]))
                pdf.set_text_color(*GOLD_DARK)
                pdf.cell(0, 9, shape(content), align="R", new_x="LMARGIN", new_y="NEXT")
                pdf.ln(0.5)
            elif kind == "h4":
                pdf.set_font("amiri", "B", 11.5)
                pdf.set_text_color(*INK)
                pdf.cell(0, 8, shape(content), align="R", new_x="LMARGIN", new_y="NEXT")
            elif kind == "p":
                pdf.paragraph(content)
            elif kind == "li":
                pdf.set_text_color(*INK)
                pdf.rtl_line("•  " + strip_md(content), size=11.5, h=6.6)
            elif kind == "oli":
                pdf.rtl_line(strip_md(content), size=11.5, h=6.6)
            elif kind == "quote":
                pdf.set_fill_color(*IVORY)
                pdf.set_text_color(*GREY)
                pdf.rtl_line(strip_md(content), size=11, color=GREY, h=6.4)
                pdf.ln(1)
            elif kind == "table":
                for row in content:
                    line = "  —  ".join(strip_md(cell) for cell in row if cell)
                    if not line.strip():
                        continue
                    pdf.set_fill_color(250, 248, 242)
                    pdf.rtl_line(line, size=9.2, color=INK, h=5.6)
                pdf.ln(1.5)
    render(blocks)
    render(blocks_t)

    # ---------- صفحة الختام ----------
    pdf.add_page()
    pdf.set_fill_color(*INK)
    pdf.rect(0, 0, 210, 297, style="F")
    pdf.set_y(120)
    pdf.set_font("amiri", "B", 20)
    pdf.set_text_color(*GOLD)
    pdf.multi_cell(0, 12, shape("خطوتك التالية"), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("amiri", "", 12)
    pdf.set_text_color(*IVORY)
    pdf.multi_cell(0, 8, shape("اختر تخصصاً واحداً الليلة، وسجّل أول 3 نماذج أعمال غداً صباحاً. " + "الطريق يبدأ هنا — وAARR معك في كل خطوة."), align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    pdf.set_font("amiri", "", 10)
    pdf.set_text_color(*GOLD)
    pdf.multi_cell(0, 7, shape("s.elghribi@edu.umi.ac.ma  |  github.com/Wynm/AARR"), align="C", new_x="LMARGIN", new_y="NEXT")

    pdf.output(str(OUT))
    print("PDF written:", OUT)

if __name__ == "__main__":
    sys.exit(build())
