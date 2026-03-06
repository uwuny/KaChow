let DATA = { battles: [] }

async function uploadReplays() {
    const fileInput = document.getElementById("fileInput")
    const files = fileInput.files
    if(files.length === 0) return alert("Выберите файлы")

    for(const file of files){
        const formData = new FormData()
        formData.append("file", file)
        try{
            const response = await fetch("https://test-production-972a.up.railway.app/upload", {
                method: "POST",
                body: formData
            })
            if(!response.ok) throw new Error("HTTP error " + response.status)
            const battle = await response.json()
            DATA.battles.push(battle)
        }catch(e){
            alert(`Ошибка при загрузке ${file.name}: ${e.message}`)
        }
    }

    loadTable("damage")
}

// ---- твоя старая функция loadTable без изменений ----
function loadTable(type,event){
    document.querySelectorAll("button").forEach(b=>b.classList.remove("active"))
    if(event) event.target.classList.add("active")

    let battles = DATA.battles
    let players = {}

    battles.forEach((battle,battleIndex)=>{
        for(let name in battle.players){
            let p = battle.players[name]
            if(!players[name]) players[name] = {}
            let value = 0
            if(type==="damage") value = p.damage
            if(type==="damage_received") value = p.damage_received
            if(type==="hits") value = `${p.shots}/${p.hits}/${p.piercings}`
            if(type==="assist") value = p.assist_track + p.assist_radio
            players[name][battleIndex] = {
                tank:p.tank,
                value:value,
                assist_track:p.assist_track,
                assist_radio:p.assist_radio,
                alive:p.alive
            }
        }
    })

    let averages = {}
    for(let name in players){
        let sum=0, count=0
        battles.forEach((battle,i)=>{
            let cell = players[name][i]
            if(!cell) return
            let v = cell.value
            if(typeof v==="number"){sum+=v;count++}
        })
        averages[name] = count ? Math.round(sum/count) : 0
    }

    function getPenRate(name){
        let shots=0,hits=0,pen=0
        battles.forEach(b=>{
            let p=b.players[name]
            if(!p) return
            shots+=p.shots; hits+=p.hits; pen+=p.piercings
        })
        if(hits==0) return 0
        return pen/hits
    }

    let sorted = Object.keys(players)
    if(type==="hits"){sorted.sort((a,b)=>getPenRate(b)-getPenRate(a))}
    else{sorted.sort((a,b)=>averages[b]-averages[a])}

    let html = "<table>"
    html+="<tr><th>Ник</th>"
    if(type==="hits"){html+="<th>%</th>"}
    battles.forEach(b=>{
        let resultClass = b.win ? "win" : "lose"
        let mapName = b.map.replace(" ","<br>")
        html+=`<th class="${resultClass}">${mapName}</th>`
    })
    if(type!=="hits"){html+="<th>Среднее</th>"}
    html+="</tr>"

    sorted.forEach(name=>{
        html+="<tr>"
        html+=`<td>${name}</td>`
        if(type==="hits"){
            let shots=0,hits=0,pen=0
            battles.forEach(b=>{
                let p=b.players[name]; if(!p) return
                shots+=p.shots; hits+=p.hits; pen+=p.piercings
            })
            let percent = hits ? Math.round(pen/hits*100) : 0
            html+=`<td>${percent}%</td>`
        }
        battles.forEach((battle,i)=>{
            let cell = players[name][i]
            if(!cell){html+="<td></td>"; return}
            let tankClass = cell.alive ? "alive" : "dead"
            let displayValue = cell.value
            if(type==="assist"){displayValue = `${cell.value}<br><small>каток:${cell.assist_track} / свет:${cell.assist_radio}</small>`}
            html+=`<td><span class="${tankClass}">${cell.tank}</span><br>${displayValue}</td>`
        })
        if(type!=="hits"){html+=`<td>${averages[name]}</td>`}
        html+="</tr>"
    })

    html+="</table>"
    document.getElementById("table").innerHTML = html
}
