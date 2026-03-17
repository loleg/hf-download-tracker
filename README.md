# Hugging Face Tracker

_A fast loading, open source, data-rich dashboard where every interaction surfaces insights effortlessly._

To configure, set the `VITE_HF_TOKEN` to a token that you generated on the [Hugging Face Access Tokens](https://huggingface.co/settings/tokens) page. It only needs FINEGRAINED access to read public repo info.

Then install and run using:

```
npm install
npm run dev
```

---

Created using [OpenHands](https://openhands.dev) with the [GLM-5](https://glm5.net) model, using this prompt:

Create a **clean, elegant, and interactive** web dashboard that visualizes the **30-day public download counts** of leading open-source LLM models (and their top 5 variants) from Hugging Face. The dashboard should prioritize **clarity, responsiveness, and user engagement**, with a focus on **line graphs** for trend analysis and **interactive filters** for customization.

### **Technical Requirements**

#### **1. Data Sourcing**
- Use the **Hugging Face Hub API** to fetch:
  - **Download counts** (last 30 days) for base models and top 5 variants.
  - **Metadata**: Model size (parameters), release date, and variant names.
  - **API Endpoint**: `https://huggingface.co/api/models/{model_id}/stats` (for download stats).
  - **Authentication**: Use Hugging Face access tokens for authorized requests.
  - **Rate Limiting**: Implement retries and caching to handle API limits gracelessly.

#### **2. Models and Variants to Include**
| Base Model      | Top 5 Variants (if available)                     |
|-----------------|---------------------------------------------------|
| OpenEuroLLM     | Base, [4 others]                                  |
| EuroLLM         | 22B, [4 others]                                   |
| Olmo            | Olmo 3-Base 7B, Olmo 3-Base 32B, [3 others]      |
| Apertus         | Apertus-SEA-LION-v4-8B-IT, [4 others]            |
| Qwen            | Qwen3-235B-A22B, Qwen3-Coder-Next, [3 others]     |
| Mistral         | Mixtral 8x22B, Mistral 7B Instruct, [3 others]   |
| SEA-LION        | [Top 5 variants]                                  |
| GLM             | GLM 4.6, [4 others]                              |
| K2 Kimi         | Kimi K2.5, Kimi K2-Instruct-0905, [3 others]      |

#### **3. Visualization Specifications**
- **Primary Visualization**: **Line graphs** for 30-day download trends.
  - **X-axis**: Date (last 30 days).
  - **Y-axis**: Download count.
  - **Lines**: One per model/variant, with unique colors and labels.
  - **Tooltips**: Show exact download count, model size, and release date on hover.
- **Secondary Visualization**: **Metadata table** (sortable/filterable) with:
  - Model name, variant, parameters, release date, total downloads.
- **Interactive Features**:
  - Toggle visibility of models/variants (legend or sidebar).
  - Adjust time range (default: 30 days).
  - Filter by model size or release date.

#### **4. Technical Stack**
- **Frontend**:
  - **Framework**: React.js (for interactivity) or Vue.js.
  - **Visualization**: Highcharts, Chart.js, or D3.js for line graphs.
  - **UI Components**: Use a library like Material-UI or Tailwind CSS for responsive design.
  - **State Management**: Redux or Context API for handling user filters.
- **Backend** (if needed):
  - **Language**: Python (Flask/FastAPI) or Node.js.
  - **API Calls**: Fetch and cache Hugging Face data.
  - **Data Processing**: Aggregate daily download counts for smooth trends.
- **Deployment**:
  - Host on Vercel, Netlify, or GitHub Pages for static frontends.
  - Use Docker + AWS/Heroku for full-stack apps.

#### **5. Design Principles**
- **Color Scheme**: Use a **distinct, accessible palette** (e.g., [ColorBrewer](https://colorbrewer2.org/)).
- **Typography**: Clean, modern fonts (e.g., Inter, Roboto).
- **Layout**: Single-page, grid-based with collapsible sections for metadata.
- **Responsiveness**: Mobile-first design (test on Chrome DevTools).
- **Loading States**: Skeletons/spinners for API data fetching.

#### **6. Example Code Snippets**
```javascript
// React + Highcharts Example
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const Dashboard = ({ data }) => {
  const options = {
    title: { text: 'LLM Model Download Trends (Last 30 Days)' },
    xAxis: { type: 'datetime' },
    yAxis: { title: { text: 'Download Count' } },
    series: data.map(model => ({
      name: model.name,
      data: model.downloads,
      color: model.color,
    })),
    tooltip: {
      pointFormat: `
        <b>{series.name}</b><br/>
        Downloads: {point.y}<br/>
        Size: {point.size}B<br/>
        Released: {point.releaseDate}
      `,
    },
  };
  return <HighchartsReact highcharts={Highcharts} options={options} />;
};
```

```python
# Python Backend Example (Flask)
from flask import Flask, jsonify
import requests

app = Flask(__name__)

@app.route('/api/downloads')
def get_downloads():
    models = ["OpenEuroLLM", "Mistral", ...]  # List all models
    data = []
    for model in models:
        response = requests.get(f"https://huggingface.co/api/models/{model}/stats")
        data.append(response.json())
    return jsonify(data)
```

#### **7. Helpful References**
- **Hugging Face API Docs**: [https://huggingface.co/docs/hub/api](https://huggingface.co/docs/hub/api)
- **Highcharts Tutorial**: [https://www.highcharts.com/docs](https://www.highcharts.com/docs)
- **React + D3.js Guide**: [https://react.d3js.org/](https://react.d3js.org/)
- **Color Accessibility**: [https://webaim.org/resources/contrastchecker/](https://webaim.org/resources/contrastchecker/)
- **Responsive Design**: [https://getbootstrap.com/docs/5.3/layout/grid/](https://getbootstrap.com/docs/5.3/layout/grid/)

---

### **Deliverables**
1. **Interactive Dashboard**: Deployed web app with:
   - Line graphs for download trends.
   - Filters for models, time range, and metadata.
   - Metadata table.
2. **Code Repository**: GitHub repo with:
   - Frontend (React/Vue) + backend (if applicable).
   - README with setup instructions.
3. **Documentation**: Brief guide on how to update models/data.


