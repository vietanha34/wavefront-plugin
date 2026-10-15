# Sổ bất biến — <EPIC>

**APPEND-ONLY.** Chỉ thêm dòng. Sửa hay xoá dòng cũ là mất bằng chứng vì sao một quyết định
từng được chọn, và đó là thứ đắt nhất để dựng lại.

Mỗi dòng: mã · ngày · quy tắc ngữ nghĩa · test ghim nó.
Đổi một bất biến thì **thêm dòng mới trỏ về dòng cũ**, không sửa dòng cũ.

```
I-01  (YYYY-MM-DD) <quy tắc ngữ nghĩa, một câu>
      Test ghim: <đường dẫn test>

I-02  (YYYY-MM-DD) Thay I-01: <quy tắc mới và vì sao>
      Test ghim: <đường dẫn test>
```

Đây cũng là nơi đúng cho **tri thức sản phẩm** mà `docs/RULES.md §D` chuyển ra khỏi
`lessons.md` — ví dụ ngữ nghĩa giá trị thiếu, hay quy tắc row identity của một báo cáo.
