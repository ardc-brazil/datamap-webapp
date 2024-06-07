import React from 'react'
import Layout from "../../components/Layout"

export default function DataPolicyPage() {
  return (
    <Layout >
      <h1>Data Policy</h1>
      <p>We are dedicated to providing valuable datasets for research and analysis. Please review the following data policy to understand the terms and conditions related to the use of data from our platform.</p>

      <h3>Usage of Data</h3>
      <p>All data available on the Datamap platform is intended for research and academic purposes. Users are encouraged to utilize these datasets to advance their studies and projects.</p>

      <h3>Notification of Authors</h3>
      <p>If you use any data originated from the Datamap Project in your research, publications, or presentations, you must notify the authors of the data. Proper attribution is required to acknowledge the contributions of the data providers. Please include the following information in your citations:</p>
      <ul>
        <li className="ml-8 list-disc">Title of the dataset</li>
        <li className="ml-8 list-disc">Authors of the dataset</li>
        <li className="ml-8 list-disc">Date of data publication</li>
        <li className="ml-8 list-disc">Source: Datamap Project</li>
        <li className="ml-8 list-disc">URL of the dataset</li>
      </ul>

      <h3>Data Sharing and Redistribution</h3>
      <p>You are permitted to share and redistribute data obtained from the Datamap Project, provided that you comply with the following conditions:</p>
      <ul>
        <li className="ml-8 list-disc">Do not alter the data in any way that could mislead others.</li>
        <li className="ml-8 list-disc">Provide proper attribution to the original authors and the Datamap Project.</li>
        <li className="ml-8 list-disc">Include a link to the original dataset on the Datamap platform.</li>
      </ul>

      <h3>Disclaimer</h3>
      <p>The Datamap Project makes no guarantees regarding the accuracy, completeness, or reliability of the data provided. Users are responsible for verifying the suitability of the data for their intended purposes. The Datamap Project and its contributors are not liable for any direct or indirect damages resulting from the use of the data.</p>

      <h3>Contact Us</h3>
      <p>If you have any questions or require further information about our data policy, please do not hesitate to contact us at <a href="mailto:amaia@usp.br">amaia@usp.br</a>.</p>

      <p>Thank you for using the Datamap Project. We appreciate your adherence to this data policy and your commitment to ethical data usage.</p>

    </Layout>
  )
}
