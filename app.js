let records = JSON.parse(localStorage.getItem("experimentRecords")) || [];

const saveButton = document.getElementById("saveButton");
const csvButton = document.getElementById("csvButton");

saveButton.addEventListener("click", saveRecord);

csvButton.addEventListener("click", exportCSV);

function saveRecord() {

  const record = {

    date:
      document.getElementById("date").value,

    cage:
      document.getElementById("cage").value,

    lot:
      document.getElementById("lot").value,

    control:
      document.getElementById("control").value,

    infection:
      document.getElementById("infection").value,

    weight:
      document.getElementById("weight").value,

    water:
      document.getElementById("water").checked,

    food:
      document.getElementById("food").checked,

    bedding:
      document.getElementById("bedding").checked,

    memo:
      document.getElementById("memo").value

  };

  records.push(record);

  localStorage.setItem(
    "experimentRecords",
    JSON.stringify(records)
  );

  displayRecords();

  alert("保存しました");

}

function displayRecords() {

  const table =
    document.getElementById("dataTable");

  table.innerHTML = "";

  records.forEach(record => {

    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>${record.date}</td>
      <td>${record.cage}</td>
      <td>${record.lot}</td>
      <td>${record.control}</td>
      <td>${record.infection}</td>
      <td>${record.weight}</td>
      <td>${record.water ? "○" : ""}</td>
      <td>${record.food ? "○" : ""}</td>
      <td>${record.bedding ? "○" : ""}</td>
      <td>${record.memo}</td>
    `;

    table.appendChild(row);

  });

}

function exportCSV() {

  let csv =
    "日付,ケージ,Lot,Control,感染側,体重,水替え,餌,床敷き,備考\n";

  records.forEach(record => {

    csv += [
      record.date,
      record.cage,
      record.lot,
      record.control,
      record.infection,
      record.weight,
      record.water ? "○" : "",
      record.food ? "○" : "",
      record.bedding ? "○" : "",
      record.memo
    ].join(",");

    csv += "\n";

  });

  const bom =
    new Uint8Array([0xEF, 0xBB, 0xBF]);

  const blob =
    new Blob(
      [bom, csv],
      { type: "text/csv;charset=utf-8;" }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "experiment_data.csv";

  link.click();

}

displayRecords();