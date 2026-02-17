export default function PaymentBar() {
  const { items, clear } = useCart();

  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // Loyalty
  const [enableLoyalty, setEnableLoyalty] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Redeem
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);

  // ==============================
  // TOTAL QTY (bukan total harga)
  // ==============================
  const totalQty = useMemo(() => {
    return items.reduce((sum, i) => sum + i.qty, 0);
  }, [items]);

  // ==============================
  // FETCH CUSTOMER POINT
  // ==============================
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!enableLoyalty || !customerPhone || customerPhone.length < 5) {
        setCustomerPoints(null);
        return;
      }

      try {
        const res = await api.get(
          `/customers/by-phone/${customerPhone}`
        );

        if (res.data.exists) {
          setCustomerPoints(res.data.points || 0);
          if (!customerName) {
            setCustomerName(res.data.name || "");
          }
        } else {
          setCustomerPoints(0);
        }
      } catch {
        setCustomerPoints(null);
      }
    };

    fetchCustomer();
  }, [customerPhone, enableLoyalty]);

  // ==============================
  // VALIDATION
  // ==============================
  const redeemInvalid =
    redeemPoints % 10 !== 0 ||
    (customerPoints !== null && redeemPoints > (customerPoints || 0));

  // Full redeem rule:
  // 10 poin per 1 qty
  const requiredFullRedeemPoints = totalQty * 10;

  const fullRedeemAvailable =
    enableLoyalty &&
    customerPoints !== null &&
    customerPoints >= requiredFullRedeemPoints &&
    totalQty > 0;

  const handleAutoPrint = async (receiptText: string) => {
    setPrinting(true);
    try {
      await printViaBluetooth(receiptText);
    } catch {
      printViaWeb(receiptText);
    } finally {
      setPrinting(false);
    }
  };

  // ==============================
  // PAY FUNCTION
  // ==============================
  const pay = async (
    method: "cash" | "qris" | "redeem",
    forceRedeemPoints?: number
  ) => {
    if (!items.length) {
      alert("Cart masih kosong");
      return;
    }

    try {
      const res = await api.post("/transactions/", {
        items: items.map((i) => ({
          product_id: i.product_id,
          qty: i.qty,
        })),
        payment_method: method,
        customer_phone: enableLoyalty ? customerPhone || null : null,
        customer_name: enableLoyalty ? customerName || null : null,
        redeem_points:
          method === "redeem"
            ? forceRedeemPoints
            : enableLoyalty && redeemPoints > 0
            ? redeemPoints
            : 0,
      });

      const transactionId = res.data.id;

      localStorage.setItem(
        "last_transaction_id",
        String(transactionId)
      );

      const printRes = await api.post(`/print/${transactionId}`);
      const receiptText = printRes.data.receipt;

      if (!receiptText) {
        alert("Struk tidak tersedia");
        return;
      }

      await handleAutoPrint(receiptText);
      setPreviewReceipt(receiptText);

      // reset state
      setCustomerPhone("");
      setCustomerName("");
      setRedeemPoints(0);
      setCustomerPoints(null);
      setEnableLoyalty(false);

      clear();
      alert("Transaksi sukses!");
    } catch (e: any) {
      alert(e?.response?.data?.detail || "Transaksi gagal");
    }
  };

  const reprintLast = async () => {
    const lastId = localStorage.getItem("last_transaction_id");
    if (!lastId) {
      alert("Belum ada transaksi untuk dicetak");
      return;
    }

    try {
      const res = await api.post(`/print/${lastId}`);
      const receiptText = res.data.receipt;
      if (!receiptText) return;
      setPreviewReceipt(receiptText);
      await handleAutoPrint(receiptText);
    } catch {
      alert("Gagal print ulang");
    }
  };

  return (
    <>
      <div className="mt-auto space-y-3">

        {/* LOYALTY */}
        <div className="bg-white p-3 rounded-xl shadow space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-black">
            <input
              type="checkbox"
              checked={enableLoyalty}
              onChange={(e) => setEnableLoyalty(e.target.checked)}
            />
            Gunakan Loyalty / Redeem Poin
          </label>

          {enableLoyalty && (
            <>
              <input
                type="text"
                placeholder="Nomor HP"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              {customerPoints !== null && (
                <div className="text-sm font-medium text-green-600">
                  Saldo Poin: {customerPoints}
                </div>
              )}

              <input
                type="text"
                placeholder="Nama (opsional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-lg p-2 text-black"
              />

              {/* Partial Redeem */}
              <input
                type="number"
                placeholder="Redeem poin (kelipatan 10)"
                value={redeemPoints || ""}
                min={0}
                step={10}
                onChange={(e) =>
                  setRedeemPoints(Number(e.target.value))
                }
                className={`w-full border rounded-lg p-2 text-black ${
                  redeemInvalid ? "border-red-500" : ""
                }`}
              />

              {redeemInvalid && (
                <div className="text-xs text-red-500">
                  Redeem harus kelipatan 10 & tidak melebihi saldo
                </div>
              )}
            </>
          )}
        </div>

        {/* FULL REDEEM BUTTON */}
        {fullRedeemAvailable && (
          <button
            type="button"
            className="w-full bg-purple-600 text-white py-3 rounded-lg"
            onClick={() =>
              pay("redeem", requiredFullRedeemPoints)
            }
          >
            🎁 REDEEM GRATIS ({requiredFullRedeemPoints} poin)
          </button>
        )}

        {/* PAYMENT BUTTONS */}
        <button
          type="button"
          className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("cash")}
          disabled={printing || redeemInvalid}
        >
          {printing ? "Printing..." : "CASH"}
        </button>

        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg disabled:opacity-50"
          onClick={() => pay("qris")}
          disabled={printing || redeemInvalid}
        >
          {printing ? "Printing..." : "QRIS"}
        </button>

        <button
          type="button"
          className="w-full bg-gray-600 text-white py-3 rounded-lg"
          onClick={reprintLast}
        >
          PRINT ULANG
        </button>
      </div>

      {previewReceipt && (
        <ReceiptPreview
          receipt={previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          onPrint={async () => {
            await handleAutoPrint(previewReceipt);
          }}
        />
      )}
    </>
  );
}