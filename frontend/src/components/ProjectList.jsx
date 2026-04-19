import React from 'react';
import { Link } from 'react-router-dom';

const projectListContainerStyle = {
    width: '80%',

}

const tableConntainerStyle = {
    marginBottom: '20px',
    width: '80%',
}

const thStyle = {
    padding: '8px',
    borderBottom: '1px solid #ccc'
}

const tdStyle = {
    padding: '8px',
    borderBottom: '1px solid #ccc'
}

const ProjectList = ({ projects }) => {
  // projects を年度ごとにグループ化
  const groupedProjects = projects.reduce((acc, project) => {
    const year = new Date(project.start_date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(project);
    return acc;
  }, {});

  return (
    <div style={projectListContainerStyle}>
      {/* Dashboard側で「プロジェクト一覧」の見出しがあるのでここでは不要 */}
      {Object.keys(groupedProjects).length === 0 ? (
        <p>プロジェクトはまだありません。</p>
      ) : (
        Object.keys(groupedProjects)
          .sort()
          .map(year => (
            <div key={year}>
              <h2>{year}</h2>
              <table border="1" cellPadding="5" style={tableConntainerStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '30%' }}>開始日</th>
                    <th style={{ ...thStyle, width: '70%' }}>プロジェクト名</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedProjects[year].map(project => (
                    <tr key={project.id}>
                      <td style={tdStyle}>
                        {new Date(project.start_date).toLocaleDateString()}
                        </td>
                      <td style={tdStyle}>
                        <Link to={`/projects/${project.id}`}>
                          {project.name}
                        </Link>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
      )}
    </div>
  );
};

export default ProjectList;
